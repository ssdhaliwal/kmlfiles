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
                    "href": "https://google.com/mapfiles/ms/micons/green-dot.png",
                },
                "heading": "0.0"
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
                    0: {
                        "state": "closed",
                        "href": "https://maps.google.com/mapfiles/kml/pal5/icon3.png",
                    },
                    1: {
                        "state": "open",
                        "href": "https://maps.google.com/mapfiles/kml/pal5/icon11.png",
                    }
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
                    this.styles["#" + id] = childItem;
                }
                if (childItem.nodeName === "StyleMap") {
                    skipChildren = true;

                    let id = this.getNodeAttribute(childItem, "id");
                    this.styleMaps["#" + id] = childItem;
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

    getBoolean(value) {
        switch (value.toLowerCase()) {
            case "error": case "reject": case "closed": case "hide": case "hidden":
            case "false": case "off": case "no": case "none":
            case "0":
            case null: case undefined: return false;
            default: return true;
        }
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

    getRGBColor(color) {
        let value = {}, bb, gg, rr;

        color = color.replace("#", "");

        if (color) {
            if (color.length === 8) {
                bb = color.substr(2, 2);
                gg = color.substr(4, 2);
                rr = color.substr(6, 2);

                value = "#" + rr + gg + bb;
            } else if (color.length === 6) {
                bb = color.substr(0, 2);
                gg = color.substr(2, 2);
                rr = color.substr(4, 2);

                value = "#" + rr + gg + bb;
            } else {
                value = getRandomColor("ffffff");
            }
        } else {
            value = getRandomColor("ffffff");
        }

        return value;
    };

    getRGBOpacity(color) {
        let value = {}, aa;

        color = color.replace("#", "");

        if (color) {
            if (color.length === 8) {
                aa = color.substr(0, 2);

                value = parseFloat(parseInt(aa, 16) / 256).toFixed(1);
            } else {
                value = 1.0;
            }
        } else {
            value = 1.0;
        }

        return value;
    };

    getRandomColor(color) {
        let aa = "ff";
        let bb = "ff";
        let gg = "ff";
        let rr = "ff";

        color = color.replace("#", "");

        if (color) {
            if (color.length === 8) {
                aa = color.substr(0, 2);
                bb = color.substr(2, 2);
                gg = color.substr(4, 2);
                rr = color.substr(6, 2);
            } else if (color.length === 6) {
                bb = color.substr(0, 2);
                gg = color.substr(2, 2);
                rr = color.substr(4, 2);
            }
        }

        if (bb !== "00") {
            bb = Math.round(parseInt(bb, 16) * Math.random()).toString(16);
        }
        if (gg !== "00") {
            gg = Math.round(parseInt(gg, 16) * Math.random()).toString(16);
        }
        if (rr !== "00") {
            rr = Math.round(parseInt(rr, 16) * Math.random()).toString(16);
        }

        return "#" + aa + bb + gg + rr;
    };

    getDefaultStyle(styleType) {
        return this.stylesDefault[styleType];
    };

    getStyle(styleUrl) {
        let value = {};
        let styleNode = this.styles[styleUrl];

        if (styleNode) {
            console.log(styleNode);

            // IconStyle
            let childNodes = styleNode.getElementsByTagName("IconStyle")[0];
            if (childNodes) {
                value.IconStyle = this.getDefaultStyle("IconStyle");
                let color = this.getNodeValue(childNodes, "color");
                if (color) {
                    value.IconStyle.color = color;
                }

                let colorMode = this.getNodeValue(childNodes, "colorMode");
                if (!colorMode) {
                    colorMode = value.IconStyle.colorMode;
                }
                if (colorMode === "random") {
                    value.IconStyle.color = this.getRandomColor(value.IconStyle.color);
                }

                let scale = this.getNodeValue(childNodes, "scale");
                if (scale) {
                    value.IconStyle.scale = parseFloat(scale);
                }

                let heading = this.getNodeValue(childNodes, "heading");
                if (heading) {
                    value.IconStyle.heading = parseFloat(heading);
                }

                let iconNodes = childNodes.getElementsByTagName("Icon")[0];
                if (iconNodes) {
                    value.IconStyle.Icon.href = this.getNodeValue(iconNodes, "href");
                }
            }

            // LineStyle
            childNodes = styleNode.getElementsByTagName("LineStyle")[0];
            if (childNodes) {
                value.LineStyle = this.getDefaultStyle("LineStyle");
                let color = this.getNodeValue(childNodes, "color");
                if (color) {
                    value.LineStyle.color = color;
                }

                let colorMode = this.getNodeValue(childNodes, "colorMode");
                if (!colorMode) {
                    colorMode = value.LineStyle.colorMode;
                }
                if (colorMode === "random") {
                    value.LineStyle.color = this.getRandomColor(value.LineStyle.color);
                }

                let width = this.getNodeValue(childNodes, "width");
                if (width) {
                    value.LineStyle.width = parseInt(width);
                }
            }

            // PolyStyle
            childNodes = styleNode.getElementsByTagName("PolyStyle")[0];
            if (childNodes) {
                value.PolyStyle = this.getDefaultStyle("PolyStyle");
                let color = this.getNodeValue(childNodes, "color");
                if (color) {
                    value.PolyStyle.color = color;
                }

                let colorMode = this.getNodeValue(childNodes, "colorMode");
                if (!colorMode) {
                    colorMode = value.PolyStyle.colorMode;
                }
                if (colorMode === "random") {
                    value.PolyStyle.color = this.getRandomColor(value.PolyStyle.color);
                }

                let fill = this.getNodeValue(childNodes, "fill");
                if (fill) {
                    value.PolyStyle.fill = this.getBoolean(fill);
                }

                let outline = this.getNodeValue(childNodes, "outline");
                if (outline) {
                    value.PolyStyle.outline = this.getBoolean(outline);
                }
            }

            // BalloonStyle
            childNodes = styleNode.getElementsByTagName("BalloonStyle")[0];
            if (childNodes) {
                value.BalloonStyle = this.getDefaultStyle("BalloonStyle");
                let bgColor = this.getNodeValue(childNodes, "bgColor");
                if (bgColor) {
                    value.BalloonStyle.bgColor = bgColor;
                }

                let colorMode = this.getNodeValue(childNodes, "colorMode");
                if (!colorMode) {
                    colorMode = value.BalloonStyle.colorMode;
                }
                if (colorMode === "random") {
                    value.BalloonStyle.bgColor = this.getRandomColor(value.BalloonStyle.bgColor);
                }

                let textColor = this.getNodeValue(childNodes, "textColor");
                if (textColor) {
                    value.BalloonStyle.textColor = textColor;
                }

                let displayMode = this.getNodeValue(childNodes, "displayMode");
                if (displayMode) {
                    value.BalloonStyle.displayMode = this.getBoolean(displayMode);
                }
            }

            // ListStyle
            childNodes = styleNode.getElementsByTagName("ListStyle")[0];
            if (childNodes) {
                value.ListStyle = this.getDefaultStyle("ListStyle");
                let bgColor = this.getNodeValue(childNodes, "bgColor");
                if (bgColor) {
                    value.ListStyle.bgColor = bgColor;
                }

                let colorMode = this.getNodeValue(childNodes, "colorMode");
                if (!colorMode) {
                    colorMode = value.ListStyle.colorMode;
                }
                if (colorMode === "random") {
                    value.ListStyle.bgColor = this.getRandomColor(value.ListStyle.bgColor);
                }

                let listItemType = this.getNodeValue(childNodes, "listItemType");
                if (listItemType) {
                    value.ListStyle.listItemType = listItemType;
                }

                let maxSnippetLines = this.getNodeValue(childNodes, "maxSnippetLines");
                if (maxSnippetLines) {
                    value.ListStyle.maxSnippetLines = parseInt(maxSnippetLines);
                }

                let itemIconNodes = childNodes.getElementsByTagName("ItemIcon");
                if (itemIconNodes && (itemIconNodes.length > 0)) {
                    value.ListStyle.ItemIcon = {};

                    for(let ii = 0; ii < itemIconNodes.length; ii++) {
                        let id = this.getNodeAttribute(itemIconNodes[ii], "id");
                        let state = this.getNodeValue(itemIconNodes[ii], "state");
                        let href = this.getNodeValue(itemIconNodes[ii], "href");
                        
                        value.ListStyle.ItemIcon[state] = {
                            id: id,
                            state: state,
                            href: href
                        }
                    }
                }
            }

            // LabelStyle
            childNodes = styleNode.getElementsByTagName("LabelStyle")[0];
            if (childNodes) {
                value.LabelStyle = this.getDefaultStyle("LabelStyle");
                let color = this.getNodeValue(childNodes, "color");
                if (color) {
                    value.LabelStyle.color = color;
                }

                let colorMode = this.getNodeValue(childNodes, "colorMode");
                if (!colorMode) {
                    colorMode = value.LabelStyle.colorMode;
                }
                if (colorMode === "random") {
                    value.LabelStyle.color = this.getRandomColor(value.LabelStyle.color);
                }

                let scale = this.getNodeValue(childNodes, "scale");
                if (scale) {
                    value.LabelStyle.scale = parseFloat(scale);
                }
            }
        }

        return value;
    };

    createLayer() {
        let self = this;
        Object.keys(self.styles).forEach(function (item) {
            console.log(item, self.styles[item]); // value
            console.log(self.getStyle(item));
        });
    };
};
