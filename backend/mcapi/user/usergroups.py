from ..mcapp import app
from ..decorators import crossdomain, apikey, jsonp
import json
from flask import g, request
import rethinkdb as r
from ..utils import set_dates
from .. import error
from .. import dmutil
from .. import resp
from .. import args
from .. import access


@app.route('/access/new', methods=['POST'])
@apikey
@crossdomain(origin='*')
def create_access_r():
    j = request.get_json()
    access = {}
    access['user_id'] = dmutil.get_required('user_id', j)
    access['project_id'] = dmutil.get_required('project_id', j)
    access['project_name'] = dmutil.get_required('project_name', j)
    access['permissions'] = dmutil.get_optional('permissions', j)
    access['birthtime'] = r.now()
    access['mtime'] = r.now()
    access['dataset'] = ""
    rr = list(r.table('access')
              .filter({
                  'user_id': access['user_id'],
                  'project_id': access['project_id']
              }).run(g.conn))
    if rr:
        return error.already_exists(
            "User already exists %s" % (access['user_id']))
    else:
        id = dmutil.insert_entry('access', access)
        return resp.to_json_id(id)


@app.route('/access/<id>/remove', methods=['DELETE'])
@apikey
@crossdomain(origin='*')
def remove_access(id):
    item = dmutil.get_single_from_table('access', id, raw=True)
    if item is None:
        return error.not_found("No such access: %s" % id)
    else:
        rv = r.table('access').get(id).delete().run(g.conn)
        if rv['deleted'] == 0:
            return error.database_error("Unable to remove access %s" % (id))
    return args.json_as_format_arg(item)


@app.route('/usergroups/new', methods=['POST'])
@apikey
@crossdomain(origin='*')
def newusergroup():
    user = access.get_user()
    u_group = request.get_json(silent=False)
    exists = list(r.table('usergroups')
                  .get_all(u_group['name'], index='name')
                  .filter({'owner': user}).run(g.conn))
    if not exists:
        new_u_group = {}
        new_u_group['name'] = dmutil.get_required('name', u_group)
        new_u_group['description'] = dmutil.get_optional('description',
                                                         u_group)
        new_u_group['access'] = dmutil.get_optional('access', u_group)
        new_u_group['users'] = u_group['users']
        new_u_group['owner'] = user
        new_u_group['projects'] = dmutil.get_optional('projects', u_group, [])
        set_dates(new_u_group)
        id = dmutil.insert_entry('usergroups', new_u_group)
        return resp.to_json_id(id)
    else:
        return error.bad_request("Usergroup already exists: " +
                                 u_group['name'])


@app.route('/usergroup/<usergroup>/datafiles')
@jsonp
def list_datafiles_by_usergroup(usergroup):
    selection = list(r.table('usergroups').filter({'id': usergroup}).
                     outer_join(
                         r.table('datafiles'),
                         lambda urow, drow: drow['owner'] in urow['users'])
                     .run(g.conn, time_format='raw'))
    return make_json_obj_for_join(selection, 'data')


def make_json_obj_for_join(selection, use_name):
    if not selection:
        return json.dumps(selection)
    obj = selection[0]['left']
    obj[use_name] = []
    for item in selection:
        obj[use_name].append(item['right'])
    return args.json_as_format_arg(obj)


@app.route('/usergroup/<usergroup>', methods=['GET'])
@apikey(shared=True)
@jsonp
def get_usergroup(usergroup):
    user = access.get_user()
    ugroup = r.table('usergroups').get(usergroup) \
                                  .run(g.conn, time_format='raw')
    if ugroup:
        access.check(user, ugroup['owner'])
        return args.json_as_format_arg(ugroup)
    else:
        error.bad_request("No such usergroup: %s" % (usergroup))


@app.route('/usergroup/<usergroup>/users', methods=['GET'])
@apikey(shared=True)
@jsonp
def list_users_by_usergroup(usergroup):
    user = access.get_user()
    ugroup = r.table('usergroups').get(usergroup)\
                                  .run(g.conn, time_format='raw')
    if ugroup:
        access.check(user, ugroup['owner'])
        return args.json_as_format_arg(ugroup)
    else:
        error.bad_request("No such usergroup: %s" % (usergroup))


@app.route('/usergroup/<usergroup_id>/selected_name/<selected_name>',
           methods=['PUT'])
@apikey
@crossdomain(origin='*')
def add_user_to_u_group(usergroup_id, selected_name):
    user = access.get_user()
    if user_in_usergroup(selected_name, usergroup_id):
        return error.not_acceptable("User %s already in group" %
                                    (selected_name))
    access.check_ownership(usergroup_id, user)
    updated_users_list = r.table('usergroups')\
                          .get(usergroup_id)['users']\
                          .append(selected_name).run(g.conn)
    r.table('usergroups').get(usergroup_id)\
                         .update({'users': updated_users_list}).run(g.conn)
    access.reset()
    return args.json_as_format_arg({'id': selected_name})


@app.route('/usergroup/<usergroup_id>/selected_name/<selected_name>/remove',
           methods=['PUT'])
@apikey
@crossdomain(origin='*')
def remove_user_from_usergroup(usergroup_id, selected_name):
    res = r.table('usergroups').get(usergroup_id)['users']\
                               .difference([selected_name]).run(g.conn)
    r.table('usergroups').get(usergroup_id).update({'users': res}).run(g.conn)
    ugroup = r.table('usergroups').get(usergroup_id)\
                                  .run(g.conn, time_format='raw')
    access.reset()
    return args.json_as_format_arg(ugroup)


def user_in_usergroup(user, usergroup):
    ugroup = r.table('usergroups').get(usergroup).run(g.conn)
    if ugroup:
        return user in ugroup['users']
    return False


@app.route('/usergroup/<usergroup_id>/project/<project_id>',
           methods=['PUT'])
@apikey
@crossdomain(origin='*')
def add_project(usergroup_id, project_id):
    project = r.table('projects').get(project_id).run(g.conn)
    updated_projects_list = r.table('usergroups').get(usergroup_id)['projects'].append({'id': project["id"], 'name': project["name"]}).run(g.conn)
    r.table('usergroups').get(usergroup_id).update({'projects': updated_projects_list }).run(g.conn)
    return args.json_as_format_arg({'id': project['name']})


@app.route('/usergroup/<usergroup_id>/project/<project_id>/remove',
           methods=['PUT'])
@apikey
@crossdomain(origin='*')
def remove_project(usergroup_id, project_id):
    project = r.table('projects').get(project_id).run(g.conn)
    res = r.table('usergroups').get(usergroup_id)['projects']\
                               .difference([{'id': project["id"], 'name': project["name"]}]).run(g.conn)
    r.table('usergroups').get(usergroup_id).update({'projects': res}).run(g.conn)
    ugroup = r.table('usergroups').get(usergroup_id)\
                                  .run(g.conn, time_format='raw')
    access.reset()
    return args.json_as_format_arg(ugroup)


@app.route('/usergroups/project/<project_id>', methods=['GET'])
@apikey(shared=True)
@jsonp
def usergroups_by_project(project_id):
    project = r.table('projects').get(project_id).run(g.conn)
    ugs = list(r.table('usergroups').filter(lambda ug: ug['projects']\
                   .contains({'id': project['id'], 'name': project['name']}))\
                   .order_by('name').run(g.conn, time_format='raw'))
    return args.json_as_format_arg(ugs)
