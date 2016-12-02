class ProcessSettings2DateComponentController {
    /*@ngInject*/
    constructor(experimentsService, toast, $stateParams) {
        this.experimentsService = experimentsService;
        this.toast = toast;
        this.$stateParams = $stateParams;
        this.projectId = $stateParams.project_id;
        this.experimentId = $stateParams.experiment_id;
        this.datePickerOptions = {
            formatYear: 'yy',
            startingDay: 1
        };
        this.date = new Date(this.setting.value);
    }

    openDatePicker($event, prop) {
        $event.preventDefault();
        $event.stopPropagation();
        prop.opened = true;
    }

    updateDateProperty(property) {

        property.value =
            this.experimentsService.convertDateValueForTransport(this.date);

        property.setup_attribute = this.attribute;
        let propertyArgs = {
            template_id: this.templateId,
            properties: [property]
        };

        this.experimentsService.updateProcess(this.projectId, this.experimentId, this.processId, propertyArgs)
            .then(
                () => null,
                () => this.toast.error('Unable to update property')
            );
    }
}

angular.module('materialscommons').component('processSettings2Date', {
    templateUrl: 'app/global.components/process/process-settings2-date.html',
    controller: ProcessSettings2DateComponentController,
    bindings: {
        setting: '<',
        templateId: '<',
        attribute: '<',
        processId: '<'
    }
});
