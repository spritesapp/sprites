/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../Element.ts" />
/// <reference path="../ElementProperty.ts" />
/// <reference path="../../App.ts" />

module Ifly.Models.Generators {
    /** Represents an element factory. */
    export class ElementFactory {

        /**
         * Returns the editable element for a given element.
         * @param {Element} element Element.
         */
        public static makeEditable(element: Element): EditableElement {
            var ret = null, t = element.type(), existing = null,
                properties = null, existingProperties = null, find = (props, n) => {
                    var result = null;

                    for (var i = 0; i < props.length; i++) {
                        if (props[i].name() == n) {
                            result = props[i];
                            break;
                        }
                    }

                    return result;
                };

            ret = new window['Ifly']['Models'][ElementType[t].substr(0, 1).toUpperCase() +
                ElementType[t].substr(1) + 'Element'](element);

            if (ret != null) {
                ret.position(element.position());

                existingProperties = element.properties();
                properties = ret.serializeProperties();

                for (var i = 0; i < properties.length; i++) {
                    existing = find(existingProperties, properties[i].name());
                    if (existing) {
                        existing.value(properties[i].value());
                    } else {
                        element.properties.push(properties[i]);
                    }
                }
            }

            return ret;
        }
    }
}