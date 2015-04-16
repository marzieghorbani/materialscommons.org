from ..mcapp import app
from ..decorators import crossdomain, apikey, jsonp
from flask import g, request
import rethinkdb as r
from .. import args
from os.path import dirname, basename
import json
from .. import dmutil
from .. import validate
from .. import error
from loader.model import access as am
from loader.model import datadir, project
from .. import process, access


@app.route('/projects', methods=['GET'])
@apikey(shared=True)
@jsonp
def get_all_group_projects():
    user = access.get_user()
    projects = []
    if access.is_administrator(user):
        projects = list(r.table('projects').order_by('name')
                        .filter(r.row["owner"].ne("delete@materialscommons.org"))
                        .run(g.conn, time_format='raw'))
    else:
        projects = list(r.table('access').get_all(user, index='user_id')
                        .eq_join('project_id', r.table('projects')).zip()
                        .order_by('name')
                        .run(g.conn, time_format='raw'))
    add_computed_attributes(projects, user)
    return args.json_as_format_arg(projects)


def add_computed_attributes(projects, user):
    for p in projects:
        p['reviews'] = []
        p['samples'] = []
        p['drafts'] = []
        p['processes'] = []
        p['users'] = []
        p['notes'] = []
        p['events'] = []
    project_ids = [p['id'] for p in projects]
    projects_by_id = {p['id']: p for p in projects}

    if len(projects) > 0:
        add_users(projects_by_id, project_ids)
        add_reviews(projects_by_id, project_ids)
        add_samples(projects_by_id, project_ids)
        add_drafts(projects_by_id, project_ids, user)
        add_processes(projects_by_id, project_ids)
        add_notes(projects_by_id, project_ids)
        add_events(projects_by_id, project_ids)


def add_users(projects_by_id, project_ids):
    users = list(r.table('access')
                 .get_all(*project_ids, index='project_id')
                 .run(g.conn, time_format='raw'))
    add_computed_items(projects_by_id, users, 'project_id', 'users')


def add_reviews(projects_by_id, project_ids):
    reviews = list(r.table('reviews')
                   .get_all(*project_ids, index='project')
                   .run(g.conn, time_format='raw'))
    add_computed_items(projects_by_id, reviews, 'project', 'reviews')


def add_samples(projects_by_id, project_ids):
    # samples = list(r.table('projects2samples')
    #                .get_all(*project_ids, index='project_id')
    #                .eq_join('sample_id', r.table('samples'))
    #                .zip()
    #                .order_by('name')
    #                .run(g.conn, time_format='raw'))
    samples = []
    add_computed_items(projects_by_id, samples, 'project_id', 'samples')


def add_drafts(projects_by_id, project_ids, user):
    drafts = list(r.table('drafts')
                  .get_all(*project_ids, index='project_id')
                  .filter({'owner': user})
                  .run(g.conn, time_format='raw'))
    add_computed_items(projects_by_id, drafts, 'project_id', 'drafts')


def add_processes(projects_by_id, project_ids):
    processes = []
    # for project_id in project_ids:
    #     processes.extend(process.get_processes(project_id))
    add_computed_items(projects_by_id, processes, 'project_id', 'processes')


def add_notes(projects_by_id, project_ids):
    notes = list(r.table('notes').get_all(*project_ids, index='project_id')
                 .order_by('mtime')
                 .run(g.conn, time_format='raw'))
    add_computed_items(projects_by_id, notes, 'project_id', 'notes')


def add_events(projects_by_id, project_ids):
    events = list(r.table('events').get_all(*project_ids, index='project_id')
                  .order_by('mtime')
                  .run(g.conn, time_format='raw'))
    add_computed_items(projects_by_id, events, 'project_id', 'events')


def add_computed_items(projects_by_id, items, projects_key, item_key):
    for item in items:
        project_id = item[projects_key]
        if project_id in projects_by_id:
            projects_by_id[project_id][item_key].append(item)


@app.route('/projects/<project_id>/tree2')
@apikey(shared=True)
@jsonp
def get_project_tree2(project_id):
    user = access.get_user()
    proj = r.table('projects').get(project_id).run(g.conn)
    if proj is None:
        return error.bad_request("Unknown project id: %s" % (project_id))
    access.check(user, proj['owner'], project_id)
    selection = list(r.table("project2datadir")
                     .get_all(project_id, index="project_id")
                     .eq_join("datadir_id", r.table("datadirs"))
                     .zip()
                     .merge(lambda dd: {
                         "datafiles": r.table("datadir2datafile")
                         .get_all(dd['id'], index="datadir_id")
                         .eq_join("datafile_id", r.table("datafiles"))
                         .zip()
                         .coerce_to("array")
                    .merge(lambda df: {
                         "tags": r.table("tag2item")
                         .get_all(df['id'], index="item_id")
                         .eq_join("tag_id", r.table("tags"))
                         .zip().pluck('id')
                         .coerce_to("array"),
                        "notes": r.table("note2item")
                        .get_all(df['id'], index="item_id")
                        .eq_join("note_id", r.table("notes"))
                        .zip()
                        .coerce_to("array")
                         })
                    })
                     .run(g.conn, time_format="raw"))
    return build_tree(selection)


class DItem2:
    def __init__(self, id, name, type, owner, birthtime, size):
        self.id = id
        self.selected = False
        self.c_id = ""
        self.level = 0
        self.parent_id = ""
        self.name = name
        self.owner = owner
        self.mediatype = ""
        self.birthtime = birthtime
        self.size = size
        self.displayname = basename(name)
        self.type = type
        self.children = []


class DEncoder2(json.JSONEncoder):
    def default(self, o):
        return o.__dict__


def build_tree(datadirs):
    next_id = 0
    all_data_dirs = {}
    top_level_dirs = []
    for ddir in datadirs:
        ditem = DItem2(ddir['id'], ddir['name'], 'datadir', ddir['owner'],
                       ddir['birthtime'], 0)
        ditem.level = ditem.name.count('/')
        ditem.tags = []  # ddir['tags']
        ditem.c_id = next_id
        next_id = next_id + 1
        #
        # The item may have been added as a parent
        # before it was actually seen. We check for
        # this case and grab the children to add to
        # us now that we have the details for the ditem.
        if ditem.name in all_data_dirs:
            existing_ditem = all_data_dirs[ditem.name]
            ditem.children = existing_ditem.children
        all_data_dirs[ditem.name] = ditem
        if ditem.level == 0:
            top_level_dirs.append(ditem)
        for df in ddir['datafiles']:
            if df['name'][0] == ".":
                continue
            if not df['current']:
                continue
            dfitem = DItem2(df['id'], df['name'], 'datafile',
                            df['owner'], df['birthtime'], df['size'])
            dfitem.fullname = ddir['name'] + "/" + df['name']
            dfitem.c_id = next_id
            next_id = next_id + 1
            dfitem.tags = df['tags']
            dfitem.notes = df['notes']
            if 'mediatype' not in df:
                dfitem.mediatype = "unknown"
            elif 'mime' not in df['mediatype']:
                dfitem.mediatype = "unknown"
            else:
                dfitem.mediatype = df['mediatype']['mime']
            ditem.children.append(dfitem)
        parent_name = dirname(ditem.name)
        if parent_name in all_data_dirs:
            parent = all_data_dirs[parent_name]
            parent.children.append(ditem)
        else:
            # We haven't seen the parent yet, but we need
            # to add the children. So, create a parent with
            # name and add children. When we finally see it
            # we will grab the children and add them to the
            # real object.
            parent = DItem2('', parent_name, 'datadir', '', '', 0)
            parent.children.append(ditem)
            all_data_dirs[parent_name] = parent
    return json.dumps(top_level_dirs, cls=DEncoder2)


@app.route('/projects', methods=['POST'])
@apikey
@crossdomain(origin='*')
def create_project():
    j = request.get_json()
    user = access.get_user()
    name = dmutil.get_required('name', j)
    if validate.project_name_exists(name, user):
        return get_project_toplevel_datadir(name, user)
    datadir_id = make_toplevel_datadir(j, user)
    proj = project.Project(name, datadir_id, user)
    project_id = dmutil.insert_entry_id('projects', proj.__dict__)
    r.table("datadirs").get(datadir_id).update({
        "project": project_id
    }).run(g.conn)
    proj2datadir = {'project_id': project_id, 'datadir_id': datadir_id}
    dmutil.insert_entry('project2datadir', proj2datadir)
    # add entry to access table
    access_entry = am.Access(user, project_id, name)
    dmutil.insert_entry('access', access_entry.__dict__)
    return args.json_as_format_arg(proj2datadir)


def get_project_toplevel_datadir(project, user):
    filter_by = {'name': project, 'owner': user}
    selection = list(r.table('projects').filter(filter_by).run(g.conn))
    proj = selection[0]
    rv = {'project_id': proj['id'], 'datadir_id': proj['datadir']}
    return args.json_as_format_arg(rv)


def make_toplevel_datadir(j, user):
    name = dmutil.get_required('name', j)
    access = dmutil.get_optional('access', j, "private")
    ddir = datadir.DataDir(name, access, user, "")
    dir_id = dmutil.insert_entry_id('datadirs', ddir.__dict__)
    return dir_id


@app.route('/project/<id>/reviews')
@apikey(shared=True)
@jsonp
def get_reviews_for_project(id):
    user = access.get_user()
    project = r.table('projects').get(id).run(g.conn)
    if project is None:
        return error.not_found('No such project: %s' % (id))
    access.check(user, project['owner'], project['id'])
    reviews = list(r.table('reviews')
                   .get_all(id, index='project').order_by(r.desc('mtime'))
                   .run(g.conn, time_format='raw'))
    return args.json_as_format_arg(reviews)
