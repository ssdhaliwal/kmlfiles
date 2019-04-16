"use strict";

// kml object
class KMLParser {
    constructor(kmlString) {
        this.kmlRaw = kmlString;
        this.folders = {
            "path": "",
            "level": 0,
            "placemarkCount": 0,
            "placemarks": {}
        };
        this.styles = {};
        this.styleMaps = {};
        this.stylesDefault = {
            "IconStyle": {
                "color": "ff00ff00",
                "colorMode": "random",              /* normal, random */
                "scale": "1.1",
                "Icon": {
                    "href": "https://maps.google.com/mapfiles/kml/pal3/icon21.png",
                },
                "heading": "0.0",
                "hotSpot": ""
            },
            "LabelStyle": {
                "color": "ff0000cc",
                "colorMode": "random",
                "scale": "1.5"
            },
            "LineStyle": {
                "color": "7f0000ff",
                "colorMode": "random",
                "width": "4"
            },
            "PolyStyle": {
                "color": "ff0000cc",
                "colorMode": "random",
                "fill": "1",
                "outline": "1"
            },
            "ListStyle": {
                "listItemType": "checkHideChildren",    /* radioFolder, check, checkHideChildren, checkOffOnly */
                "bgColor": "ff336699",
                "ItemIcon": {
                    "state": "closed",
                    "href": "https://maps.google.com/mapfiles/kml/pal3/icon21.png",
                },
                "maxSnippetLines": "5"
            },
            "BalloonStyle": {
                "bgColor": "ffffffbb",
                "textColor": "CC0000",
                "displayMode": "default"                /* default, hide */
            }
        };
    };

    _defaultStyles(styleType) {

    };

    processKml(kmlString) {
        let kmlRaw = "";

        // if kml is empty; use the base string
        if (!kmlString) {
            kmlRaw = this.kmlRaw;
        } else {
            kmlRaw = kmlString;
        }

        // parse using DOM, or ActiveX, otherwise return null.
        if (typeof ActiveXObject !== 'undefined' && typeof GetObject !== 'undefined') {
            let doc = new ActiveXObject('Microsoft.XMLDOM');
            doc.loadXML(kmlRaw);
            this.kmlDOC = doc;
        }

        if (typeof DOMParser !== 'undefined') {
            let doc = (new DOMParser()).parseFromString(kmlRaw, 'text/xml');
            this.kmlDOC = doc;
        }

        // build the folder structure
        this.discoverNodes(this.kmlDOC);
    };

    discoverNodes(node) {
        // scan for features
        let level = 0;
        this.folders = this.discoverChildNodes(level, node, this.folders);

        // scan for networklink

        console.log(this.folders, this.styles, this.styleMaps);
    };

    discoverChildNodes(level, node, folders) {
        // process child items
        let skipChildren = false;
        for (let childItem of node.childNodes) {
            level++;
            let savedFolder = folders;
            skipChildren = false;

            if ((childItem.nodeName !== "#text") && (childItem.nodeName !== "#comment")) {
                // scan for all placemarks and store them into folder
                if (childItem.nodeName === "Placemark") {
                    skipChildren = true;

                    let id = this.getNodeAttribute(childItem, "id");
                    let name = this.getNodeValue(childItem, "name");

                    folders.placemarkCount++;
                    id = (id || name || folders.placemarkCount);
                    folders.placemarks[id] = childItem;
                }

                // if a folder or document; create hiearchy tree
                if ((childItem.nodeName === "Folder") || (childItem.nodeName === "Document")) {
                    let name = this.getNodeValue(childItem, "name");

                    if (name && (name !== "")) {
                        folders[name] = {
                            "path": savedFolder.path + "/" + name,
                            "level": level,
                            "placemarkCount": 0,
                            "placemarks": {}
                        };

                        folders = folders[name];
                    }
                }

                // style; store in global lookup
                if (childItem.nodeName === "Style") {
                    skipChildren = true;

                    let id = this.getNodeAttribute(childItem, "id");
                    this.styles[id] = childItem;
                }
                if (childItem.nodeName === "StyleMap") {
                    skipChildren = true;

                    let id = this.getNodeAttribute(childItem, "id");
                    this.styleMaps[id] = childItem;
                }

                // scan child nodes
                if (!skipChildren && childItem.childNodes) {
                    this.discoverChildNodes(level, childItem, folders);
                    folders = savedFolder;
                }
            }
            level--;
        }

        return folders;
    };

    getNodeBooleanValue(node) {
        var value = this.getNodeTextValue(node);

        switch (value.toLowerCase()) {
            case "error": case "reject": case "closed": case "hide": 
            case "false": case "off": case "no":
            case "0":
            case null: case undefined: return false;
            default: return true;
        }
    };

    getNodeIntegerValue(node) {
        var value = this.getNodeTextValue(node);
        return parseInt(value, 10);
    };

    getNodeFloatValue(node) {
        var value = this.getNodeTextValue(node);
        return parseFloat(value);
    };

    getNodeValue(node, element) {
        let value = undefined;
        for (let childItem of node.childNodes) {
            if (childItem.nodeName === element) {
                value = (childItem.innerText || childItem.text || childItem.textContent);
            }
        }

        return (value ? value.trim() : value);
    };

    getNodeAttribute(node, attribute) {
        let value = undefined;
        value = node.getAttribute(attribute);

        return value;
    };

    createLayer() {

    };

    buildStyle(styles) {
        // IconStyle
        // LineStyle
        // LineStyle
        // PolyStyle
        // BalloonStyle
        // ListStyle
        // LabelStyle

        // parse all styles and store style info
        console.log(styleNodes);
        var styleId, styleNode, nodeId;
        Object.keys(styleNodes).forEach(function (style) {
            nodeId = style.getAttribute("id");

            if (nodeId) {
                styleId = "#" + nodeId;
                console.log(styleId);
            }
        });
    }
};
