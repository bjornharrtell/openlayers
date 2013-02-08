/**
 * Class: OpenLayers.Topology.Rule.VerticesMustIntersect
 * This rule will be satisfied if each considered vertex intersects at least one other vertex.
 */
OpenLayers.Topology.Rule.VerticesMustIntersect = OpenLayers.Class(OpenLayers.Topology.Rule, {
	layer: null,
	
	/**
     * Constructor: OpenLayers.Topology.Rule.VerticesMustIntersect
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     * 
     * Valid options properties:
     * enforce - {Boolean} Set to true if the rule should be enforced on geometry operations.
     */
	initialize: function(options) {
		OpenLayers.Topology.Rule.prototype.initialize.apply(this, arguments);
	},
	
	/** 
     * Property: enforce 
     * {Object} A vertex intersection cache.
     */
	cache: {},
	
	/**
	 * Method: onVertexmodified
	 * Handler for the vertex modified event that will enforce the rule if enabled
	 */
    onVertexmodified: function(e) {
        var i,ilen;
        
        var vertex = e.vertex;
        
        var vc = this.cache[vertex.id];
        if (vc === undefined) {return;}

        for (i=0, ilen=vc.length; i<ilen; i++) {
        	var featurei = vc[i].feature;
        	var vertexi = vc[i].vertex;
        	vertexi.move(e.dx, e.dy);
            if (featurei.state != OpenLayers.State.INSERT && featurei.state != OpenLayers.State.DELETE) {
            	featurei.state = OpenLayers.State.UPDATE;
            }
            this.layer.drawFeature(featurei);
        }
    },
    
    /**
     * Method: onAfterfeaturemodified
     * Handler for afterfeaturemodified event which will trigger recalculation of the involved features.
     */
    onAfterfeaturemodified: function(e) {
   	    this.calcVertexCaches(e.feature, true);
    },
    
    /**
     * Method: setEnforce
     * Attach the onVertexmodified on enforcement and vice verca.
     * 
     * Parameters:
     * enforce - {Boolean} To enforce or not.
     */
    setEnforce: function(enforce) {
        if (enforce) {
            this.layer.events.registerPriority("vertexmodified", this, this.onVertexmodified);
        }
        else {
            this.layer.events.unregister("vertexmodified", this, this.onVertexmodified);
        }
    },

    /**
     * Method: calcVertexCache
     * Calculate vertex cache for single vertex against a geometry that supports getVertices.
     * 
     * Parameters:
     * vertex - {<OpenLayers.Geometry.Point>} The vertex to calculate the cache for.
     * feature - {<OpenLayers.Feature.Vector>} The feature that the vertices to check belongs to.
     * 
     * Returns:
     * {Boolean} The vertex are intersecting one or more of the the feature vertices.
     */
    calcVertexCache: function(vertex, feature) {
        var i, ilen, hasIntersectingVertices = false;

        if (this.cache[vertex.id] === undefined) {
            this.cache[vertex.id] = [];
        }

        var vertices = feature.geometry.getVertices();
        for (i=0, ilen=vertices.length; i<ilen; i++) {
            var vertexi = vertices[i];
            
            if (vertex.equals(vertexi)) {
                this.cache[vertex.id].push({vertex: vertexi, feature: feature});
                hasIntersectingVertices = true;
            }            
        }
        
        return hasIntersectingVertices;
    },
    
    /**
     * Method: areVerticesIntersecting
     * Checks if vertices are intersecting other vertices using the cache.
     * 
     * Parameters:
     * vertices - {Array} Array of vertices.
     * 
     * Returns:
     * {Boolean} The vertices are intersecting other vertices.
     */
    areVerticesIntersecting: function(vertices) {
        var i, ilen, state = true;
        
        for (i=0, ilen=vertices.length; i<ilen; i++) {
            var vertexi = vertices[i];
            
            if (this.cache[vertexi.id].length===0) { 
                state = false;
            }
        }
        
        return state;
    },

    /**
     * Method: getIntersectingFeatures
     * Uses the vertex intersection cache to find the involved intersecting features in a collection of vertices.
     * 
     * Parameters:
     * vertices - {Array} Array of vertices.
     * 
     * Returns:
     * {Array} The features that have vertices that intersect the input vertices.
     */
    getIntersectingFeatures: function(vertices) {
        var i, ilen, k, klen, features = [];
        
        var contains = function(feature) {
        	var j, jlen;
        	
        	for (j=0, jlen=features.length; j<jlen; j++) {
                if (features[j] === feature) {
                	return true;
                }
            }
        	
        	return false;
        };
        
        for (i=0, ilen=vertices.length; i<ilen; i++) {
            var vertexi = vertices[i];
            
            var vc = this.cache[vertexi.id];
            
            for (k=0, klen=vc.length; k<klen; k++) {
            	var feature = vc[k].feature;
                if (!contains(feature)) {
                	features.push(feature);
                }
            }
        }
        
        return features;
    },
    
    /**
     * Method: calcVertexCaches
     * Checks if vertices are intersecting other vertices using the cache.
     * 
     * Parameters:
     * feature - {<OpenLayers.Vector.Feature>} The feature to process.
     * calcIntersecting - {Boolean} If true, features of vertices that are intersecting the 
     *     input feature vertices will also have their vertex cache recalculated.
     */
    calcVertexCaches: function(feature, calcIntersecting) {
        var i, ilen, j, jlen, 
            layer = this.layer,
            geometry = feature.geometry,
            vertices = geometry.getVertices(),
            features = layer.features;
        
        if (geometry instanceof OpenLayers.Geometry.Point) return;
        
        for (i=0, ilen=vertices.length; i<ilen; i++) {
            delete this.cache[vertices[i].id];
        }
        
        for (i=0, ilen=features.length; i<ilen; i++) {
            var featurei = features[i];
            var geometryi = featurei.geometry;
            if (featurei === feature) continue;
            
            if (geometryi instanceof OpenLayers.Geometry.Point) continue;
            
            for (j=0, jlen=vertices.length; j<jlen; j++) {
                var vertexj = vertices[j];
                
                this.calcVertexCache(vertexj, featurei);
            }
        }
        
        if (calcIntersecting === true) {
        	this.calcFeatures(this.getIntersectingFeatures(vertices));
        }
        
        // TODO: make optional?
        if (this.areVerticesIntersecting(vertices)) {
            feature.renderIntent = "default";
            layer.drawFeature(feature);
        }
        else {
            feature.renderIntent = "error";
            layer.drawFeature(feature);
        }
    },
    
    /**
     * Method: calcFeatures
     * Calculate vertex cache for features
     * 
     * Parameters:
     * features - {Array} The features to process. If not supplied all 
     *     features of the attached layer will be processed.
     */ 
    calcFeatures: function(features) {
        var i, ilen;
                
        for (i=0, ilen=features.length; i<ilen; i++) {
            var feature = features[i];
            
            this.calcVertexCaches(feature, false);
        }
    },
    
    /**
     * Method: calc
     * Calculate vertex cache for all features
     * 
     * Parameters:
     * features - {Array} The features to process. If not supplied all 
     *     features of the attached layer will be processed.
     */ 
    calc: function() {
         this.calcFeatures(this.layer.features);
    },
    
    /**
      * Method: activate
      * Will cause the rule state to be calculated once and each time whenever
      * geometry is changed in a way that affects the rule.
      */
    activate: function() {
         this.calc();

         this.layer.events.registerPriority("afterfeaturemodified", this, this.onAfterfeaturemodified);
         this.layer.events.registerPriority("featureadded", this, this.calc);
    },
    
    /**
      * Method: deactivate
      * Will stop the rule state to be calculated.
      */
    deactivate: function() {
         this.layer.events.unregister("afterfeaturemodified", this, this.onAfterfeaturemodified);
         this.layer.events.unregister("featureadded", this, this.calc);
    },
    
    /**
     * Method: destroy
     * Cleanup.
     */
    destroy: function() {
        this.deactivate();
    }

});