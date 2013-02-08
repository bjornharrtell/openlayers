/**
 * Class: OpenLayers.Topology.Rule
 * Abstract topology rule. Not to be instantiated directly. Use one of the rule subclasses instead.
 */
OpenLayers.Topology.Rule = OpenLayers.Class({

    /**
     * Property: layer 
     * {<OpenLayers.Layer.Vector>} The layer to apply the rule to.
     */
    layer: null,

    /** 
     * Property: enforce 
     * {Boolean} If true the rule will be enforces on geometry operations.
     */
    enforce: true,

    /**
     * Constructor: OpenLayers.Topology.Rule
     * Abstract class for topology rules.  Create instances of a subclass.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     *     
     * Valid options properties:
     * enforce - {Boolean} Set to true if the rule should be enforced on geometry operations.
     */
    initialize: function(options) {
        options = options || {};
        OpenLayers.Util.extend(this, options);
    },
    
    /**
     * Method: setEnforce
     * Cause the rule to be enforced on geometry operations.
     * 
     * Parameters:
     * enforce - {Boolean} To enforce or not.
     */
    setEnforce: function(enforce) {
    },
    
    /**
     * Method: activate
     * Will cause the rule state to be calculated once and each time whenever
     * geometry is changed in a way that affects the rule.
     */
    activate: function() {
    },
    
    /**
     * Method: deactivate
     * Will stop the rule state to be calculated.
     */
    deactivate: function() {
    },
    
    /**
     * Method: destroy
     * Cleanup.
     */
    destroy: function() {
    }
});