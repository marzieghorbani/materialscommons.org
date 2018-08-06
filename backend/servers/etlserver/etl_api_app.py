import logging
import json
import pkg_resources
from flask import Flask, request
from flask_api import status

from .globus_etl.etl_task_library import startup_and_verify
from .globus_etl.BuildProjectExperiment import BuildProjectExperiment
from .database.DatabaseInterface import DatabaseInterface
from .database.DB import DbConnection
from .download.GlobusDownload import GlobusDownload
from .globus_non_etl_upload.GlobusUpload import GlobusUpload
from .user import access
from .user.api_key import apikey
from .utils.UploadUtility import UploadUtility
from .common.GlobusInfo import GlobusInfo

log = logging.getLogger(__name__)

log.debug("Starting Flask with {}".format(__name__.split('.')[0]))

app = Flask(__name__.split('.')[0])


def format_as_json_return(what):
    if 'format' in request.args:
        return json.dumps(what, indent=4)
    else:
        return json.dumps(what)


@app.before_request
def before_request():
    DbConnection().set_connection()


@app.teardown_request
def teardown_request(exception):
    DbConnection().close_connection()
    if exception:
        pass


@app.route('/')
def hello_world():
    return format_as_json_return({"hello": "world"})


@app.route('/version')
def get_version():
    return format_as_json_return({
        "version": pkg_resources.get_distribution("materials_commons").version
    })


@app.route('/globus/stage', methods=['POST'])
@apikey
def stage_background_excel_upload():
    log.debug("/globus/stage - starting")
    user_id = access.get_user()
    j = request.get_json(force=True)
    experiment_name = j["name"]
    experiment_description = j["description"]
    project_id = j["project_id"]
    globus_endpoint = j["globus_uuid"]
    excel_file_path = j["globus_excel_file"]
    data_dir_path = j["globus_data_dir"]
    log.debug("/globus/stage - args - user_id = {}".format(user_id))
    log.debug("/globus/stage - args - project_id = {}".format(project_id))
    log.debug("/globus/stage - args - experiment_name = {}".format(experiment_name))
    log.debug("/globus/stage - args - experiment_description = {}".format(experiment_description))
    log.debug("/globus/stage - args - globus_endpoint = {}".format(globus_endpoint))
    log.debug("/globus/stage - args - excel_file_path = {}".format(excel_file_path))
    log.debug("/globus/stage - args - data_dir_path = {}".format(data_dir_path))
    results = startup_and_verify(user_id, project_id, experiment_name, experiment_description,
                                 globus_endpoint, excel_file_path, data_dir_path)
    log.debug("/globus/stage - done {}".format(results))
    return format_as_json_return(results)


@app.route('/globus/monitor', methods=['POST'])
@apikey
def monitor_background_excel_upload():
    log.debug("/globus/monitor - starting")
    j = request.get_json(force=True)
    log.debug("Results as json = {}".format(j))
    try:
        status_record_id = j['status_record_id']
        log.debug("status_record_id = {}".format(status_record_id))
        status_record = {
            "status": "Fail",
            "reason": "Status record unavailable",
            "status_record_id": status_record_id
        }
        if status_record_id:
            status_record = DatabaseInterface().get_status_record(status_record_id)
            del status_record['birthtime']
            del status_record['mtime']
    except KeyError:
        status_record = {
            "status": "Fail",
            "reason": "Failed to get status_record_id from request",
            "status_record_id": None
        }
    status_record_json = format_as_json_return(status_record)
    log.debug("return as json = {}".format(status_record_json))
    log.debug("/globus/monitor - done")
    return status_record_json


@app.route('/project/status', methods=['POST'])
@apikey
def get_background_status_for_project():
    ret = "{}"
    # noinspection PyBroadException
    try:
        log.info("get_background_status_for_project")
        j = request.get_json(force=True)
        log.info("get_background_status_for_project: data in = {}".format(j))
        project_id = j['project_id']
        log.info("get_background_status_for_project: project_id = {}".format(project_id))
        status_list = DatabaseInterface().get_status_by_project_id(project_id)
        log.info("get_background_status_for_project: status_list = {}".format(status_list))
        status_record = None
        if status_list:
            status_record = {
                'status': status_list[0]['status'],
                'id': status_list[0]['id']
            }
        ret_value = {'status': status_record}
        ret = format_as_json_return(ret_value)
        log.info("get_background_status_for_project: ret = {}".format(ret))
    except Exception:
        log.info("Unexpected exception...", exc_info=True)
    return ret


@app.route('/upload', methods=['POST'])
@apikey
def upload_file():
    log.info("etl file upload - starting")
    api_key = request.args.get('apikey', default="no_such_key")
    name = request.form.get('name')
    project_id = request.form.get("project_id")
    description = request.form.get("description")
    log.info(api_key)
    log.info(name)
    log.info(project_id)
    log.info(description)
    if not name:
        message = "etl file upload - experiment name missing, required"
        log.info(message)
        return message, status.HTTP_400_BAD_REQUEST
    if not project_id:
        message = "etl file upload - project_id missing, required"
        log.info(message)
        return message, status.HTTP_400_BAD_REQUEST
    log.info("etl file upload - getting file")
    uploader = UploadUtility()
    (message_or_ret, http_status) = uploader.get_file()
    if http_status:
        return message_or_ret, http_status
    file_path = message_or_ret
    log.info("etl file upload - file saved to " + file_path)
    # noinspection PyBroadException
    try:
        builder = BuildProjectExperiment(api_key)
        builder.set_rename_is_ok(True)
        builder.preset_project_id(project_id)
        builder.preset_experiment_name_description(name, description)
        log.debug("etl file upload - build starting...")
        builder.build(file_path, None)
        log.info("etl file upload - done")
        return format_as_json_return({"project_id": project_id})
    except Exception as e:
        log.info("Unexpected exception...", exc_info=True)
        message = str(e)
        return message, status.HTTP_500_INTERNAL_SERVER_ERROR


@app.route('/globus/transfer/download', methods=['POST'])
@apikey
def globus_transfer_download():
    log.info("Project top-level directory staged for transfer with Globus - starting")
    api_key = request.args.get('apikey', default="no_such_key")
    j = request.get_json(force=True)
    project_id = j["project_id"]
    globus_user_id = j["globus_user"]
    log.info("Project id = {}; Globus user name = {}".format(project_id, globus_user_id))
    if not globus_user_id:
        message = "Project top-level directory download with Globus - globus_user_id is missing, required"
        log.error(message)
        return message, status.HTTP_400_BAD_REQUEST
    if not project_id:
        message = "Project top-level directory download with Globus - project_id missing, required"
        log.error(message)
        return message, status.HTTP_400_BAD_REQUEST
    # noinspection PyBroadException
    try:
        download = GlobusDownload(project_id, globus_user_id, api_key)
        url = download.download()
        ret_value = {'url': url}
        ret = format_as_json_return(ret_value)
        return ret
    except Exception:
        message = "Download transfer with Globus - unexpected exception"
        log.exception(message)
        return message, status.HTTP_400_BAD_REQUEST


@app.route('/globus/transfer/upload', methods=['POST'])
@apikey
def globus_transfer_upload():
    log.info("Project upload shared endpoint to top-level directory with Globus - starting")
    j = request.get_json(force=True)
    project_id = j["project_id"]
    globus_endpoint_id = j["endpoint"]
    user_id = access.get_user()
    log.info("Project id = {}; Globus user name = {}".format(project_id, globus_endpoint_id))
    if not globus_endpoint_id:
        message = "Project upload with Globus - globus_endpoint_id is missing, required"
        log.error(message)
        return message, status.HTTP_400_BAD_REQUEST
    if not project_id:
        message = "Project upload with Globus - project_id missing, required"
        log.error(message)
        return message, status.HTTP_400_BAD_REQUEST
    # noinspection PyBroadException
    try:
        upload = GlobusUpload(user_id, project_id, globus_endpoint_id)
        results = upload.setup_and_verify()
        log.info("Project id = {}; Globus user name = {}".format(project_id, results))
        ret = format_as_json_return(results)
        return ret
    except Exception:
        message = "Download transfer with Globus - unexpected exception"
        log.exception(message)
        return message, status.HTTP_400_BAD_REQUEST


@app.route('/globus/transfer/status', methods=['POST'])
@apikey
def globus_transfer_status():
    log.info("Globus background task list - starting")
    j = request.get_json(force=True)
    project_id = j["project_id"]
    log.info("Project id = {}".format(project_id))
    if not project_id:
        message = "Project upload with Globus - project_id missing, required"
        log.error(message)
        return message, status.HTTP_400_BAD_REQUEST
    # noinspection PyBroadException
    try:
        status_list = DatabaseInterface().get_status_by_project_id(project_id, limit=10)
        return_list = []
        for record in status_list:
            return_list.append(
                {
                    'timestamp': int(record['birthtime'].timestamp()),
                    'name': record['name'],
                    'queue': record['queue'],
                    'status': record['status']
                }
            )
        ret_value = {'status_list': return_list}
        ret = format_as_json_return(ret_value)
        log.info("get_background_status_for_project: ret = {}".format(ret))
        return ret
    except Exception:
        message = "Status of previous transfers with Globus - unexpected exception"
        log.exception(message)
        return message, status.HTTP_400_BAD_REQUEST


@app.route('/globus/transfer/info', methods=['GET'])
@apikey
def globus_transfer_info():
    log.info("Globus background task list - starting")
    # noinspection PyBroadException
    try:
        source = GlobusInfo()
        returned_info = source.get_all()
        for key in returned_info:
            log.info("Details from info: {} = {}".format(key, returned_info[key]))
        ret = format_as_json_return(returned_info)
        return ret
    except Exception:
        message = "Info for transfers with Globus - unexpected exception"
        log.exception(message)
        return message, status.HTTP_400_BAD_REQUEST
