import os
import logging
from ..DatabaseInterface import DatabaseInterface
from ..BackgroundProcess import BackgroundProcess
from .MaterialsCommonsGlobusInterface import MaterialsCommonsGlobusInterface
from .VerifySetup import VerifySetup


class ETLSetup:
    def __init__(self, user_id):
        self.user_id = user_id
        self.log = logging.getLogger(__name__ + "." + self.__class__.__name__)
        self.worker_base_path = os.environ.get('MC_ETL_BASE_DIR')

    def setup_status_record(self, project_id, experiment_name, experiment_description,
                 globus_endpoint, excel_file_path, data_dir_path):

        status_record = DatabaseInterface().\
            create_status_record(self.user_id, project_id, "ETL Process")

        status_record_id = status_record['id']
        DatabaseInterface().update_status(status_record_id, BackgroundProcess.INITIALIZATION)

        base_path = self.worker_base_path
        transfer_dir = self.make_transfer_dir(status_record_id)
        transfer_base_path = os.path.join(base_path, transfer_dir)
        self.log.info("excel_file_path = " + excel_file_path)
        self.log.info("data_file_path = " + data_dir_path)
        extras = {
            "experiment_name": experiment_name,
            "experiment_description": experiment_description,
            "globus_endpoint": globus_endpoint,
            "excel_file_path": excel_file_path,
            "data_dir_path": data_dir_path
        }
        status_record = DatabaseInterface().add_extras_data_to_status_record(status_record_id, extras)
        status_record_id = status_record['id']
        self.log.info("status record id = " + status_record_id)
        return status_record_id

    def verify_setup(self, status_record_id):
        results = self.verify_preconditions(status_record_id)
        if not results['status'] == 'SUCCESS':
            # here we return error messaage to user!
            self.log.error("Preconditions for transfer failed...")
            for key in results:
                self.log.error(" Failure: " + key + " :: " + results[key])
            return results
        self.log.info(results)
        return results

    def verify_preconditions(self, status_record_id):
        status_record = DatabaseInterface().update_status(status_record_id, BackgroundProcess.VERIFYING_SETUP)
        project_id = status_record['project_id']
        globus_endpoint = status_record['extras']['globus_endpoint']
        endpoint_path = status_record['extras']['endpoint_path']
        transfer_base_path = status_record['extras']['transfer_base_path']
        excel_file_relative_path = status_record['extras']['excel_file_relative_path']
        data_dir_relative_path = status_record['extras']['data_dir_relative_path']

        web_service = MaterialsCommonsGlobusInterface(self.user_id)
        checker = VerifySetup(web_service, project_id,
                              globus_endpoint, endpoint_path, transfer_base_path,
                              excel_file_relative_path, data_dir_relative_path)
        return checker.status()

    def make_transfer_dir(self, status_record_id):
        return "transfer-{}".format(status_record_id)