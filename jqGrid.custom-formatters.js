(function (factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(["jquery"], factory);
    } else if (typeof exports === "object") {
        // Node/CommonJS
        factory(require("jquery"));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    "use strict";

    function commonCallback(e, callbackName, valueGetter) {
        var $cell = $(e.target).closest("td"),
            $row = $cell.closest("tr.jqgrow"),
            $grid = $row.closest("table.ui-jqgrid-btable"),
            p,
            colModel,
            iCol;

        if ($grid.length === 1) {
            p = $grid[0].p;
            if (p) {
                iCol = $.jgrid.getCellIndex($cell[0]);
                colModel = p.colModel;
                var val = $.fn.fmatter[colModel[iCol].formatter].unformat(valueGetter($cell), colModel, $cell);
                return colModel[iCol].formatoptions[callbackName].call($grid[0],
                    val, $row.attr("id"), colModel);
            }
        }
        return false;
    }

    function commonCallbackForText(e, callbackName) {
        return commonCallback(e, callbackName, function($cell) { return $cell.text(); });
    }
    
    function commonCallbackForValue(e, callbackName) {
        return commonCallback(e, callbackName, function ($cell) { return $cell.val(); });
    }

    /*
     *   extLink - <a />
     *   supported formatoptions:
     *     url:       string or function. Default value: '#'
     *     cellValue: string or function. Default value - the cell content
     *     attr:      object, which properties defines additional attributes like "class" or "title" which can be set
     *                on the "<a>" element.
     *     mixInHtml: string or function. Addition html element for input text box
     *     mixInHtmlLast: bool. if true then mixInHtml will be placed after input, else before
     *     onClick:   function that should be called when link are clicked
     */
    $.extend(true, $.fn.fmatter, {
        extLink: function (cellValue, options, rowData) {
            // href, target, rel, title, onclick
            // other attributes like media, hreflang, type are not supported currently
            var op = { url: "#" }, attr, attrName, attrStr = "";

            if (typeof options.colModel.formatoptions !== "undefined") {
                op = $.extend({}, op, options.colModel.formatoptions);
            }
            if ($.isFunction(op.url)) {
                op.url = op.url.call(this, cellValue, options.rowId, rowData, op);
            }

            var mixInHtml = "";
            if ($.isFunction(op.mixInHtml))
                mixInHtml = op.mixInHtml.call(this, cellValue, options.rowId, rowData, op);
            else if (op.mixInHtml) {
                mixInHtml = op.mixInHtml;
            }
            if ($.isFunction(op.cellValue)) {
                cellValue = op.cellValue.call(this, cellValue, options.rowId, rowData, op);
            }
            attr = op.attr;
            if ($.isPlainObject(attr)) {
                // enumerate properties of
                for (attrName in attr) {
                    if (attr.hasOwnProperty(attrName)) {
                        if ($.isFunction(attr[attrName])) {
                            var attrVal = attr[attrName].call(this, cellValue, options.rowId, rowData, op);
                            if (typeof attrVal !== "undefined")
                                attrStr += " " + attrName + "=\"" + attrVal + "\"";
                        } else {
                            attrStr += " " + attrName + "=\"" + attr[attrName] + "\"";
                        }
                    }
                }
            }
            return "<div style='white-space:nowrap;'>"
                + (!op.mixInHtmlLast ? mixInHtml : "")
                + "<a " +
                (op.onClick ? " onclick=\"return $.fn.fmatter.extLink.onClick.call(this, arguments[0]);\"" : "") +
                " href=\"" + op.url + "\"" + attrStr + ">" +
                (cellValue || "&nbsp;") + "</a>"
                + (op.mixInHtmlLast ? mixInHtml : "")
                + "</div>";
        }
    });

    $.extend($.fn.fmatter.extLink, {
        unformat: function (cellValue, options, elem) {
            var text = $("a", elem).text();
            return text === "&nbsp;" ? "" : text;
        },
        onClick: function (e) {
            commonCallbackForText(e, "onClick");
            return false;
        }
    });

    /*
     *   extText - <span />
     *   supported formatoptions:
     *     attr:      object, which properties defines additional attributes like "class" or "title" which can be set
     *                on the "<span>" element.
     *     cellValue: string or function. Default value - the cell content
     *     onClick:   function that should be called when text are clicked
     */
    $.extend(true, $.fn.fmatter, {
        extText: function (cval, options, rowData) {
            var opt = {};
            if (typeof options.colModel.formatoptions !== "undefined") {
                opt = $.extend({}, opt, options.colModel.formatoptions);
            }

            var attr = opt.attr, attrStr = "", cellValue = cval, attrName;
            if ($.isPlainObject(attr)) {
                // enumerate properties of
                for (attrName in attr) {
                    if (attr.hasOwnProperty(attrName)) {
                        if ($.isFunction(attr[attrName])) {
                            var attrVal = attr[attrName].call(this, cellValue, options.rowId, rowData, opt);
                            if (typeof attrVal !== "undefined")
                                attrStr += " " + attrName + "=\"" + attrVal + "\"";
                        } else {
                            attrStr += " " + attrName + "=\"" + attr[attrName] + "\"";
                        }
                    }
                }
            }

            var mixInHtml = "";
            if ($.isFunction(opt.mixInHtml))
                mixInHtml = opt.mixInHtml.call(this, cellValue, options.rowId, rowData, opt);
            else if (opt.mixInHtml) {
                mixInHtml = opt.mixInHtml;
            }

            if ($.isFunction(opt.cellValue)) {
                cellValue = opt.cellValue.call(this, cellValue, options.rowId, rowData, opt);
            }

            return "<div style='white-space:nowrap;'>"
                + (!opt.mixInHtmlLast ? mixInHtml : "")
                +"<span " + attrStr +
                (opt.onClick ? " onclick=\"return $.fn.fmatter.extText.onClick.call(this, arguments[0]);\"" : "")
                +">"
				+ cellValue
				+ "</span>"
                + (opt.mixInHtmlLast ? mixInHtml : "")
                + "</div>";
        }
    });

    $.extend(true, $.fn.fmatter.extText, {
        unformat: function (cellval, options, elem) {
            var ret = $("span", elem).text();
            return ret;
        },
        onClick: function (e) {
            commonCallbackForText(e, "onClick");
            return false;
        }
    });

    /*
     *   extInput - <input/>
     *   supported formatoptions:
     *     attr:      object, which properties defines additional attributes like "class" or "title" which can be set
     *                on the "<input>" element.
     *     cellValue: string or function. Default value - the cell content
     *     mixInHtml: string or function. Addition html element for input text box
     *     mixInHtmlLast: bool. if true then mixInHtml will be placed after input, else before
     *     onClick:   function that should be called when text are clicked
     *     onChange:  function that should be called when text are changed
     *     onBlur:    function that should be called when exit editing
     */
    $.extend(true, $.fn.fmatter, {
        extInput: function (cval, options, rowData) {
            var opt = {};
            if (typeof options.colModel.formatoptions !== "undefined") {
                opt = $.extend({}, opt, options.colModel.formatoptions);
            }

            var attr = opt.attr, attrStr = "", cellValue = cval, attrName;
            if ($.isPlainObject(attr)) {
                // enumerate properties of
                for (attrName in attr) {
                    if (attr.hasOwnProperty(attrName)) {
                        if ($.isFunction(attr[attrName])) {
                            var attrVal = attr[attrName].call(this, cellValue, options.rowId, rowData, opt);
                            if (typeof attrVal !== "undefined")
                                attrStr += " " + attrName + "=\"" + attrVal + "\"";
                        } else {
                            attrStr += " " + attrName + "=\"" + attr[attrName] + "\"";
                        }
                    }
                }
            }

            var mixInHtml="";
            if ($.isFunction(opt.mixInHtml))
                mixInHtml = opt.mixInHtml.call(this, cellValue, options.rowId, rowData, opt);
            else if (opt.mixInHtml) {
                mixInHtml = opt.mixInHtml;
            }

            if ($.isFunction(opt.cellValue)) {
                cellValue = opt.cellValue.call(this, cellValue, options.rowId, rowData, opt);
            }

            return "<div style='white-space:nowrap;'>"
                + (!opt.mixInHtmlLast ? mixInHtml : "")
                + "<input "
                + attrStr 
                + (opt.onClick ? " onclick=\"return $.fn.fmatter.extInput.onClick.call(this, arguments[0]);\"" : "")
                + (opt.onChange ? " onchange=\"return $.fn.fmatter.extInput.onChange.call(this, arguments[0]);\"" : "")
                + (opt.onBlur ? " onblur=\"return $.fn.fmatter.extInput.onBlur.call(this, arguments[0]);\"" : "")
				+" value='"+cellValue+"'>"
				+ "</input>"
                + (opt.mixInHtmlLast ? mixInHtml : "")
                + "</div>";
        }
    });

    $.extend(true, $.fn.fmatter.extInput, {
        unformat: function(cellval, options, elem) {
            var ret = $("input", elem).val();
            return ret;
        },
        onClick: function(e) {
            commonCallbackForValue(e, "onClick");
            return false;
        },
        onChange: function(e) {
            commonCallbackForValue(e, "onChange");
            return false;
        },
        onBlur: function(e) {
            commonCallbackForValue(e, "onBlur");
            return false;
        }
    });

    /*
     *   imageButton - <a><img /></a>
     *   supported formatoptions:
     *     url:       string or function. Default value: '#'
     *     attr:      object, which properties defines additional attributes like "class" or "title" which can be set
     *                on the "<a>" element.
     *     imgAttr:      object, which properties defines additional attributes like "class" or "title" which can be set
     *                on the "<img>" element.
     *     mixInHtml: string or function. Addition html element for input text box
     *     mixInHtmlLast: bool. if true then mixInHtml will be placed after input, else before
     *     onClick:   function that should be called when text are clicked     
     */
    $.extend(true, $.fn.fmatter, {
        imageButton: function (cval, options, rowData) {
            var opt = { url: "#" };
            if (typeof options.colModel.formatoptions !== "undefined") {
                opt = $.extend({}, opt, options.colModel.formatoptions);
            }

            var attr = opt.attr, attrStr = "", attrName, attrVal, cellValue = cval;
            if ($.isPlainObject(attr)) {
                // enumerate properties of
                for (attrName in attr) {
                    if (attr.hasOwnProperty(attrName)) {
                        if ($.isFunction(attr[attrName])) {
                            attrVal = attr[attrName].call(this, cellValue, options.rowId, rowData, opt);
                            if(typeof attrVal !== "undefined")
                                attrStr += " " + attrName + "=\"" + attrVal + "\"";
                        } else {
                            attrStr += " " + attrName + "=\"" + attr[attrName] + "\"";
                        }
                    }
                }
            }

            var imgAttr = opt.imgAttr, imgAttrStr = "";
            if ($.isPlainObject(imgAttr)) {
                // enumerate properties of
                for (attrName in imgAttr) {
                    if (imgAttr.hasOwnProperty(attrName)) {
                        if ($.isFunction(imgAttr[attrName])) {
                            attrVal = imgAttr[attrName].call(this, cellValue, options.rowId, rowData, opt);
                            if (typeof attrVal !== "undefined")
                                imgAttrStr += " " + attrName + "=\"" + attrVal + "\"";
                        } else {
                            imgAttrStr += " " + attrName + "=\"" + imgAttr[attrName] + "\"";
                        }
                    }
                }
            }
                
            var mixInHtml = "";
            if ($.isFunction(opt.mixInHtml))
                mixInHtml = opt.mixInHtml.call(this, cellValue, options.rowId, rowData, opt);
            else if (opt.mixInHtml) {
                mixInHtml = opt.mixInHtml;
            }

            return "<div style='white-space:nowrap;'>"
                + (!opt.mixInHtmlLast ? mixInHtml : "")
                + "<a "
                + attrStr
                + (opt.onClick ? " onclick=\"return $.fn.fmatter.imageButton.onClick.call(this, arguments[0]);\"" : "")
                + ">"
                + (imgAttrStr? "<img " + imgAttrStr + "/>" : "")
				+ "</a>"
                + (opt.mixInHtmlLast ? mixInHtml : "")
                + "</div>";
        }
    });

    $.extend(true, $.fn.fmatter.imageButton, {
        unformat: function (cellval, options, elem) {
            var ret = $(elem).text();
            return ret;
        },
        onClick: function (e) {
            commonCallbackForValue(e, "onClick");
            return false;
        }
    });

    /*
     *   extSelect - <select />
     *   supported formatoptions:
     *     options:   array of {text:string, value:string, attr: object} or a function returning the same array
     *     attr:      object, which properties defines additional attributes like "class" or "title" which can be set
     *                on the "<select>" element.
     *     mixInHtml: string or function. Addition html element for input text box
     *     mixInHtmlLast: bool. if true then mixInHtml will be placed after input, else before
     *     onChange:   function that should be called when combo are changed
     */
    $.extend(true, $.fn.fmatter, {
        extSelect: function (cval, options, rowData) {
            var opt = { };
            if (typeof options.colModel.formatoptions !== "undefined") {
                opt = $.extend({}, opt, options.colModel.formatoptions);
            }

            var attr = opt.attr, attrStr = "", attrName, attrVal, cellValue = cval;
            if ($.isPlainObject(attr)) {
                // enumerate properties of
                for (attrName in attr) {
                    if (attr.hasOwnProperty(attrName)) {
                        if ($.isFunction(attr[attrName])) {
                            attrVal = attr[attrName].call(this, cellValue, options.rowId, rowData, opt);
                            if (typeof attrVal !== "undefined")
                                attrStr += " " + attrName + "=\"" + attrVal + "\"";
                        } else {
                            attrStr += " " + attrName + "=\"" + attr[attrName] + "\"";
                        }
                    }
                }
            }

            var optOpt = opt.options;
            if ($.isFunction(opt.options)) {
                optOpt = opt.options.call(this, cellValue, options.rowId, rowData, opt);
            }

            var optionsHtml = "";
            for (var i = 0; i < optOpt.length; i++) {
                optionsHtml += "<option ";
                optionsHtml += "value=\"" + optOpt[i].value + "\" ";

                var oAttr = optOpt[i].attr, oAttrStr = "", oAttrName, oAttrVal;
                if ($.isPlainObject(oAttr)) {
                    // enumerate properties of
                    for (oAttrName in oAttr) {
                        if (oAttr.hasOwnProperty(oAttrName)) {
                            if ($.isFunction(oAttr[oAttrName])) {
                                oAttrVal = oAttr[oAttrName].call(this, cellValue, options.rowId, rowData, opt);
                                if (typeof oAttrVal !== "undefined")
                                    oAttrStr += " " + oAttrName + "=\"" + oAttrVal + "\"";
                            } else {
                                oAttrStr += " " + oAttrName + "=\"" + oAttr[oAttrName] + "\"";
                            }
                        }
                    }
                }
                optionsHtml += oAttrStr;
                optionsHtml += ">";

                optionsHtml += optOpt[i].text;
                optionsHtml += "</option>";
            }

            var mixInHtml = "";
            if ($.isFunction(opt.mixInHtml))
                mixInHtml = opt.mixInHtml.call(this, cellValue, options.rowId, rowData, opt);
            else if (opt.mixInHtml) {
                mixInHtml = opt.mixInHtml;
            }

            return "<div style='white-space:nowrap;'>"
                + (!opt.mixInHtmlLast ? mixInHtml : "")
                + "<select "
                + attrStr
                + (opt.onChange ? " onchange=\"return $.fn.fmatter.extSelect.onChange.call(this, arguments[0]);\"" : "")
                + ">"
                + optionsHtml
				+ "</select>"
                + (opt.mixInHtmlLast ? mixInHtml : "")
                + "</div>";
        }
    });

    $.extend(true, $.fn.fmatter.extSelect, {
        unformat: function (cellval, options, elem) {
            var ret = $("select", elem).val();
            return ret;
        },
        onChange: function (e) {
            commonCallbackForValue(e, "onChange");
            return false;
        }
    });


}));