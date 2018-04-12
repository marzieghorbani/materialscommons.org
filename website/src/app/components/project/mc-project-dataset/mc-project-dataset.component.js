class MCProjectDatasetComponentController {
    /*@ngInject*/
    constructor(mcprojstore, projectsAPI) {
        this.mcprojstore = mcprojstore;
        this.projectsAPI = projectsAPI;
        this.project = mcprojstore.currentProject;
        console.log('this.project', this.project);
        this.grouped = false;
    }

    $onInit() {
        this.projectsAPI.getProjectSamples(this.project.id).then(
            (samples) => {
                this.samples = samples;
                this.samples.forEach(s => this.addProcessListTimeLine(s));
                let uniqueProcesses = this.computeUniqueProcesses();
                this.createHeaders(uniqueProcesses);
                //console.log('this.samples', samples);
            }
        )
    }

    addProcessListTimeLine(sample) {
        let processes = _.indexBy(sample.processes, 'process_id');
        sample.processesInTimeline = sample.processes.filter(
            (p) => processes[p.process_id].property_set_id === p.property_set_id
        ).filter(p => {
            if (p.template_name == 'Create Samples') {
                return false;
            } else if (p.template_name == 'Sectioning') {
                return false;
            }

            return true;
        }).map(p => ({
            name: p.template_name,
            process_id: p.process_id,
            seen: false
        }));
    }

    computeUniqueProcesses() {
        const allProcesses = [];
        this.samples.forEach(s => allProcesses.push(s.processesInTimeline));
        let combinedProcessTimeline = _.uniq([].concat.apply([], allProcesses), 'process_id');
        let combinedProcessTimelineMap = _.indexBy(combinedProcessTimeline, 'process_id');
        return {combinedProcessTimelineMap, combinedProcessTimeline};
    }

    createHeaders(uniqueProcesses) {
        // uniqueProcesses.combinedProcessTimeline.forEach(p => {
        //     //console.log(p.name);
        // })
        // let headers = [];
        // let first = this.samples.processesInTimeline[0];
        // for (let i = 1; i < this.samples.length; i++) {
        //
        // }
        uniqueProcesses.combinedProcessTimeline.forEach(() => null);
    }
}

angular.module('materialscommons').component('mcProjectDataset', {
    template: require('./mc-project-dataset.html'),
    controller: MCProjectDatasetComponentController
});