class MCProjectQuickbarComponentController {
    /*@ngInject*/
    constructor($stateParams, showSampleService) {
        this.showSampleService = showSampleService;
        this.$stateParams = $stateParams;
    }

    showSample(sample) {
        this.showSampleService.showSample(sample);
    }
}

angular.module('materialscommons').component('mcProjectQuickbar', {
    template: require('./mc-project-quickbar.html'),
    controller: MCProjectQuickbarComponentController,
    bindings: {
        showQuickbar: '=',
        projectSamples: '<',
        experimentSamples: '<',
        datasetSamples: '<'
    }
});
