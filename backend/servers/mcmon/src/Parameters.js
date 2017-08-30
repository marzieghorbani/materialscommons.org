class Parameters {

    constructor() {
        this.mc_dir_paths = null;
        if (process.env.MCDIR) {
            let path_list = process.env.MCDIR;
            let paths = path_list.split(":");
            this.mc_dir_paths = paths;
        }
    }

    get_mc_dir_paths(){
        return this.mc_dir_paths
    }
}

module.exports = Parameters;