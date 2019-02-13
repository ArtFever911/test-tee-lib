'use strict'
;(function(){
    
    /**
     * 
     * @param {object} jsonData 
     */
    let TreeBuilder = function( jsonData ) {
        if(jsonData instanceof Promise){
            jsonData.then(result=>{
                this.data = Object.assign({},result);
                this.build();
            })
        }else if ( jsonData instanceof Object  && jsonData) {
            this.data = Object.assign({},jsonData);
        }else {
            throw new Error('Data object is empty');
        }
        /**@var {array} - Contain hierarchy structure needed for rendering in DOM  */
		this.hierarchy = [];
        /**@var {array} - Contain hierarchy connections lines for rendering in DOM  */
		this.lines = [];
        /**@var {number} - Contain current hierarchy structure deep level  */
		this.currentDeepLevel = 0;
		/**@var {object} - Dom container needed for rendering hierarchy structure */
		this.container = document.getElementById('tree-container');
		/**@var {number} - Store current store height value */
		this.containerHeight = 0;
		/**@var {number} - Rendered node with */
		this.nodewidth = 150;
		/**@var {number} - Rendered node height */
		this.nodeHeight = 150;
		/**@var {number} - Rendered node vertical gutter */
		this.verticalGutter = 150;
		
		if(!(this.container && this.container.nodeType == 1)) {
			const container =  document.createElement('div');
			container.id = 'tree-container';
			document.body.appendChild(container);
			this.container = container;
		}
        this.build();
    };
    

    /**
     * Scan hierarchy structure recursively and return object whith target id
     * @param {array} childNodes - Array with next deeper level hierarchy
     * @param {string} searchKey - Keyword contain parent id of node needed injecting new children
     * @returns {object} - Link to node object in hierarchy structure
     */
    TreeBuilder.prototype.searchTreeNode = function(childNodes,searchKey,deep) {
		const self = this;
		let deepLevel = deep ? ++deep : 2;
		let result = {};
        /** scan every child nodes of current tree level */
        childNodes.forEach((el,i)=>{
            const {id,parent} = el;

            if(id === searchKey) {
				result = el;
				this.currentDeepLevel = deepLevel;
                return;
            }else if(id !== searchKey && childNodes[i].children){
                result = self.searchTreeNode(childNodes[i].children,searchKey,deepLevel);
                return;
            }else {
                return
            }
        })
        return result
    }


    /**
	 * Saving new tree node in queue
     * @param {object} node - Node object with data like id and deepLevel
     * @param {object} nodePosition - Link to target node in hierarchy
     */
    TreeBuilder.prototype.addTreeNode = function(node,nodePosition) {
        const self = this;
		const {id,parent} = node;
		const deepLevel = self.currentDeepLevel;

        if(!parent) {
			nodePosition.id = id;
			nodePosition.deepLevel = 1;
			
        }else {
            if(!nodePosition.children) nodePosition.children = [];
            nodePosition.children.push({
				deepLevel: deepLevel,
                id: id,
            });
        }
        
    }


    /** 
	 * Conver data array into nested object with render-rady hirearchy
	 */
    TreeBuilder.prototype.buildHierarchy = function() {
        const self = this;
        const data = this.data && this.data.data;

        if(!data) return;

        data.forEach(el => {
            const {id,parent} = el;
            /**
             * if it not first tree level
             */
            if(parent !== null) {
                 /**
                 * search parent node position
                 */
				const nodePosition = self.searchTreeNode(self.hierarchy,parent);
				/**
                 * append new node as children
                 */
                self.addTreeNode(el,nodePosition);
            }else {
				/**
                 * if it first level of tree
                 * check if it is one more child in first level
				 */
				const firstHirerarchyLevelSize = self.hierarchy.length ? self.hierarchy.length-1 : 0;
				/**
                 * add new first level position
                 */
				self.hierarchy[firstHirerarchyLevelSize] = {};
				/**
                 * append node in position created above
                 */
                self.addTreeNode(el,self.hierarchy[firstHirerarchyLevelSize]);
            }
        });
    };


    /**
	 * Calculating  start and end point coordinate of SVG vertical line
     * @param {object} diapason - Object with start and end position available for rendering for current node
     * @param {number} deepLevel - Shows how deeply from grandparent are the current node
     * @returns {object} - Object with start and end point coordinate of SVG line
     */
    TreeBuilder.prototype.calculateNodeConnectionPosition = function(diapason,deepLevel) {
		let self = this;
		let rowWitdh = diapason.end - diapason.start;
		let nodeHeight = self.nodeHeight;
		let nodeVerticalGutter = self.verticalGutter
		let lineHeight = self.verticalGutter / 2;
		let lineHorizontalGutter = (rowWitdh - 2) / 2;
		let x2Point = diapason.start + lineHorizontalGutter;
		let y2Point = nodeHeight * (deepLevel-1) + nodeVerticalGutter * (deepLevel-1);
		let x1Point = x2Point;
		let y1Point = y2Point - lineHeight;

        return {
			x1: x1Point,
			x2: x2Point,
			y1: y1Point,
			y2: y2Point
		};
	}


    /**
	 * Calculating  start and end point coordinate of SVG horizontal line
     * @param {object} diapason - Object with start and end position available for rendering for current node
     * @param {number} deepLevel - Shows how deeply from grandparent are the current node
     * @param {number} rendeCurrentIndex - Index of node on current tree level (start from 0)
     * @param {number} renderMaxIndex Index of last node on current tree level (start from 0)
     * @returns {object} - Object with start and end point coordinate of SVG line
     */
    TreeBuilder.prototype.calculateNodeHorizontalConnectionPosition = function(diapason,deepLevel,rendeCurrentIndex,renderMaxIndex) {
		const self = this;
		const rowWitdh = (diapason.end - diapason.start) / (renderMaxIndex + 1);
		const nodeWith = self.nodewidth;
		const nodeHeight = self.nodeHeight;
		const nodeVerticalGutter = self.verticalGutter
		const lineHorizontalGutter = (rowWitdh - nodeWith) / 2;
		let linLenght;
		let x1Point;
		if(deepLevel === 1) {
			linLenght = (nodeWith * renderMaxIndex) + (lineHorizontalGutter * (renderMaxIndex+1));
			x1Point = 0 + lineHorizontalGutter + (nodeWith / 2)
		}else {
			linLenght = (nodeWith * renderMaxIndex) + (lineHorizontalGutter * (renderMaxIndex+2));
			x1Point = diapason.start + lineHorizontalGutter + (nodeWith / 2);
		}
		let x2Point = x1Point + linLenght;
		let y1Point = nodeHeight * (deepLevel-1) + nodeVerticalGutter * (deepLevel-1)  + (nodeHeight * 1.5);

        return {
			x1: x1Point,
			x2: x2Point,
			y1: y1Point,
			y2: y1Point
		};
	}


    /**
	 * Calculating node position in tree parent container in DOM
     * @param {number} diapason - Object with start and end position available for rendering for current node
     * @param {number} deepLevel - Shows how deeply from grandparent are the current node
     * @returns {object} - Object with x and y position 
     */
    TreeBuilder.prototype.calculateNodePosition = function(diapason,deepLevel) {
		let self = this;
		let rowWitdh = diapason.end - diapason.start;
		let nodeWith = self.nodewidth;
		let nodeHeight = self.nodeHeight;
		let nodeVerticalGutter = self.verticalGutter;
		let nodeHorizontalGutter = (rowWitdh - nodeWith) / 2;
		let xPoint = diapason.start + nodeHorizontalGutter;
		let yPoint = nodeHeight * (deepLevel-1) + nodeVerticalGutter * (deepLevel-1);

        return {
			x: xPoint,
			y: yPoint
		};
	}
	
	/**
	 * Updating a tree parent container height
	 * @param {object} position - Position of most deeply node of tree
	 */
	TreeBuilder.prototype.updateRenderedContainerHeight = function(position){
		const self = this;
		const container = self.container;
		const nodeHeight = self.nodeHeight;
		const verticalGutter = self.verticalGutter;
		let containerHeight = self.containerHeight;
		let currentHeight = position.y + nodeHeight + verticalGutter;
		if(currentHeight > containerHeight) {
			self.containerHeight = currentHeight;
			container.style.height = currentHeight + 'px';
		}
	}


	/**
	 * Calculating an position available for rendering for current node
	 * @param {object} nodesRenderDiapason - Object with start and end position available for rendering for current node
	 * @param {number} nodeRenderCurrentIndex - Index of node on current tree level (start from 0)
	 * @param {number} nodeRenderMaxIndex Index of last node on current tree level (start from 0)
	 * @returns {object} - Object with start and end position available for rendering for current node
	 */
    TreeBuilder.prototype.calculateRenderDiapason = function(nodesRenderDiapason,nodeRenderCurrentIndex,nodeRenderMaxIndex) {
		let self = this;
		let renderContainerWidth = self.container.clientWidth;
		let parentRowWidth = nodesRenderDiapason.end - nodesRenderDiapason.start;
		let currentRowWith = parentRowWidth / (nodeRenderMaxIndex+1);
		let startPoint = currentRowWith !==renderContainerWidth ? 
			nodesRenderDiapason.start + currentRowWith * nodeRenderCurrentIndex : 0;
		let endPoint = startPoint + currentRowWith;

        return {
			start: startPoint,
			end: endPoint
		};
	}
	

	/** Creating an SVG line object and adding his to queue
	 * @param {number} x1 - The x1 attribute defines the start of the line on the x-axis
	 * @param {number} y1 - The y1 attribute defines the start of the line on the y-axis
	 * @param {number} x2 - The x2 attribute defines the end of the line on the x-axis
	 * @param {number} y2 - The y2 attribute defines the end of the line on the y-axis
	 * @param {string} strokeColor - The srtoke attribute defines the color of the line
	 * @param {number} strokeWidth - The srtoke-width attribute defines the weight of the line
	 * @returns {node} - Return DOM node object with line
	 */
	TreeBuilder.prototype.createSvgLine = function(x1,x2,y1,y2,strokeColor,strokeWidth){
		let line  = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		strokeColor = strokeColor ? strokeColor : 'rgba(0,0,0,1)';
		strokeWidth = strokeWidth ? strokeWidth : '2';
		line.setAttribute('x1', x1);
		line.setAttribute('y1', y1);
		line.setAttribute('x2', x2);
		line.setAttribute('y2', y2);
		line.setAttribute('stroke', strokeColor);
		line.setAttribute('stroke-width', strokeWidth);
		return line;
	}


	/**
	 * Adding a vertical connection between the child and his parent to queue
	 * @param {object} node - Node object with data like id and deepLevel
	 * @param {object} renderDiapason - Object with start and end position available for rendering for current node
	 */
	TreeBuilder.prototype.addNodeConnection = function(node,renderDiapason){
		let self = this;
		let deepLevel = node.deepLevel;
		if(deepLevel <= 1) return; 
 		let lines = self.lines;
		let {x1,x2,y1,y2} = self.calculateNodeConnectionPosition(renderDiapason,deepLevel);
		let line = self.createSvgLine(x1,x2,y1,y2);
		lines.push(line);	
	}


	/**
	 * Adding a vertical connection between the parent and his child to queue
	 * @param {object} node - Node object with data like id and deepLevel
	 * @param {object} renderDiapason - Object with start and end position available for rendering for current node
	 */
	TreeBuilder.prototype.addNodeChildConnections = function(node,renderDiapason){
		const self = this;
		const lines = self.lines;
		const nodeHeight = self.nodeHeight;
		const lineOffset = nodeHeight *1.5;
		const deepLevel = node.deepLevel;
		let {x1,x2,y1,y2} = self.calculateNodeConnectionPosition(renderDiapason,deepLevel);
		y1 = y1 + lineOffset;
		y2 = y2 + lineOffset;
		const line = self.createSvgLine(x1,x2,y1,y2);
		lines.push(line);
	}
	
	
	/**
	 * Adding a horizontal connection between the parent and his child to queue
	 * @param {object} renderDiapason - Object with start and end position available for rendering for current node
	 * @param {number} deepLevel - Shows how deeply from grandparent are the current node
	 * @param {number} rendeCurrentIndex - Index of node on current tree level (start from 0)
	 * @param {Number} renderMaxIndex - Index of last node on current tree level (start from 0)
	 */
	TreeBuilder.prototype.addNodeHorizontalConnection = function(renderDiapason,deepLevel,rendeCurrentIndex,renderMaxIndex){
		/** add horizontal line */
		const self = this;
		const lines = this.lines;
		let {x1,x2,y1,y2} = self.calculateNodeHorizontalConnectionPosition(renderDiapason,deepLevel,rendeCurrentIndex,renderMaxIndex);
		const horizontalLIne = self.createSvgLine(x1,x2,y1,y2);
		lines.push(horizontalLIne);
	}


    /**
	 * Rendering node in DOM
     * @param {object} node - Node object with data like id and deepLevel
	 * @param {number} renderDiapason - - Object with start and end position available for rendering for current node
     */
    TreeBuilder.prototype.renderNode = function(node,renderDiapason){
		const self = this;
		const position = self.calculateNodePosition(renderDiapason,node.deepLevel);
		/** update current container heig */
		self.updateRenderedContainerHeight(position);
		/** create DOM node */
		let nodeBlock = document.createElement('div');
		/** set class name and position */
		nodeBlock.className = 'node-item';
		nodeBlock.style.left = position.x + 'px';
		nodeBlock.style.top = position.y + 'px';
		nodeBlock.innerHTML = node.id;
		/** ouptut node  */
		self.container.appendChild(nodeBlock);
    }


    /**
	 * Rendering each tree level by invoking self recursively and going deeply
     * @param {array} nodes - Array with elemenst on this level
     * @param {object} nodesRenderDiapason - Object with start and end position available for rendering for current node
     * @param {number} nodeRenderCurrentIndex - Index of node on current tree level (start from 0)
     * @param {number} nodeRenderMaxIndex - Index of last node on current tree level (start from 0)
     */
    TreeBuilder.prototype.renderHierarchyLevel = function(nodes,nodesRenderDiapason,nodeRenderCurrentIndex,nodeRenderMaxIndex){
		const self = this;
		const levelSize = nodes.length > 0 ? nodes.length : 1;

		if(!nodesRenderDiapason) {
			nodesRenderDiapason = {
				start : 0,
				end : self.container.clientWidth
			}
		}

		if(!nodeRenderCurrentIndex) nodeRenderCurrentIndex = 0;

		if(!nodeRenderMaxIndex) nodeRenderMaxIndex = 0;

        nodes.forEach((el,i,arr)=>{
			let childMaxRenderIndex = arr && arr.length - 1;
			let childsRenderDiapason = self.calculateRenderDiapason(nodesRenderDiapason,i,childMaxRenderIndex);
			self.renderNode(el,childsRenderDiapason)
			self.addNodeConnection(el,childsRenderDiapason);
			
			if(el.children && el.children.length>1) {
				self.addNodeHorizontalConnection(childsRenderDiapason,el.deepLevel,i,levelSize);
			}

			if(el.children && el.children.length>0) {	
				self.renderHierarchyLevel(el.children,childsRenderDiapason,i,childMaxRenderIndex);
				self.addNodeChildConnections(el,childsRenderDiapason);
			}
		})
    }

	/**
	 * Rendering whole tree object
	 */
    TreeBuilder.prototype.renderHierarchy = function() {
        const self = this;
        const hierarchy = this.hierarchy;
        self.renderHierarchyLevel(hierarchy);
	}
	
	/**
	 * Rendering all nodes connections (lines) in tree
	 */
    TreeBuilder.prototype.renderConnections = function() {
        const self = this;
		const lines = self.lines;
		const container = self.container;
		const width = container.clientWidth;
		const height = container.clientHeight;
		let svgCanvas = document.getElementById('svg-connections') ?
			document.getElementById('svg-connections'):
			document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svgCanvas.id = 'svg-connections';
		svgCanvas.setAttribute('width', width);
		svgCanvas.setAttribute('height', height);
		lines.forEach(line=>{
			svgCanvas.appendChild(line);   
		}) 
		container.appendChild(svgCanvas)
    }

	/**
	 * Adding animtaion class to tree parend container
	 */
	TreeBuilder.prototype.makeMagic = function(){
		const self = this;

		setTimeout(()=>{
			self.container.classList.add('magic');
		},500)
	}


    TreeBuilder.prototype.build = function() {
		/**
		 * converting incoming data to  render-ready array
		 */
		this.buildHierarchy();
		/**
		 * rendering tree recursively
		 */
		this.renderHierarchy();
		/**
		 * rendering tree nodes connections (lines)
		 */
		this.renderConnections();
		/**
		 * adding a litle bit animation
		 */
		this.makeMagic();
    };

	/* 
	* exposing constructor globally
	*/
    window.TreeBuilder = TreeBuilder;
})()
