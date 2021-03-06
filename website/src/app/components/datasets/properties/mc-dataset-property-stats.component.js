class MCDatasetPropertyStatsComponentController {
    /*@ngInject*/
    constructor() {
    }
}


angular.module('materialscommons').component('mcDatasetPropertyStats', {
    template: `
        <p>
            <span class="small action-count">
                <span ng-if="$ctrl.dataset.stats.unique_view_count.total==1" style="padding-left: 10px;">
                    {{$ctrl.dataset.stats.unique_view_count.total}} View</span>
                <span ng-if="$ctrl.dataset.stats.unique_view_count.total!=1" style="padding-left: 10px;">
                    {{$ctrl.dataset.stats.unique_view_count.total}} Views</span>
                <span ng-if="$ctrl.dataset.stats.comment_count==1" style="padding-left: 10px;">
                    {{$ctrl.dataset.stats.comment_count}} Comment</span>
                <span ng-if="$ctrl.dataset.stats.comment_count!=1" style="padding-left: 10px;">
                    {{$ctrl.dataset.stats.comment_count}} Comments</span>
                <span ng-if="$ctrl.dataset.stats.download_count==1" style="padding-left: 10px;">
                    {{$ctrl.dataset.stats.download_count}} Download</span>
                <span ng-if="$ctrl.dataset.stats.download_count!=1" style="padding-left: 10px;">
                    {{$ctrl.dataset.stats.download_count}} Downloads</span>
                <span ng-if="$ctrl.dataset.stats.useful_count==1" style="padding-left: 10px;">
                    {{$ctrl.dataset.stats.useful_count}} User found this data useful</span>
                <span ng-if="$ctrl.dataset.stats.useful_count>1" style="padding-left: 10px;">
                    {{$ctrl.dataset.stats.useful_count}} Users found this data useful</span>
            </span>
        </p>
    `,
    controller: MCDatasetPropertyStatsComponentController,
    bindings: {
        dataset: '<'
    }
});
