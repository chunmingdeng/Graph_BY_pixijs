import Core from './core/';
import Parse from './parse';
import Transformations from './transformations'
import Exports from './exports'

let graphZ = function( options ){
    // if no options specified, use default
    if( options === undefined ){
        options = {};
    }

    // create instance
    const core = new Core( options );
    core.transformations = new Transformations(core);
    core.parse = new Parse();
    core.export = new Exports(core);

    return core;
};

export default graphZ;
// module.exports = graphZ;
