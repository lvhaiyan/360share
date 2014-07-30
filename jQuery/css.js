var curCSS, iframe, iframeDoc,
    ralpha = /alpha\([^)]*\)/i, //验证 通道
    ropacity = /opacity=([^)]*)/, // 验证不透明度
    rposition = /^(top|right|bottom|left)$/,//positon属性的验证
// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
    rdisplayswap = /^(none|table(?!-c[ea]).+)/,
    rmargin = /^margin/,
    rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ),
    rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
    rrelNum = new RegExp( "^([-+])=(" + core_pnum + ")", "i" ), //用于多 相对值进行检测
    elemdisplay = { BODY: "block" },

    cssShow = { position: "absolute", visibility: "hidden", display: "block" },
    cssNormalTransform = {
        letterSpacing: 0,
        fontWeight: 400
    },

    cssExpand = [ "Top", "Right", "Bottom", "Left" ],
    cssPrefixes = [ "Webkit", "O", "Moz", "ms" ],

    eventsToggle = jQuery.fn.toggle;

//检测浏览器前缀
// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {
    
    // shortcut for names that are not vendor prefixed
    if ( name in style ) {
        return name;
    }

    // check for vendor prefixed names
    var capName = name.charAt(0).toUpperCase() + name.slice(1),
        origName = name,
        i = cssPrefixes.length;

    while ( i-- ) {
        name = cssPrefixes[ i ] + capName;
        if ( name in style ) {
            return name;
        }
    }

    return origName;
}

function isHidden( elem, el ) {
    elem = el || elem;
    return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
}

//显示隐藏元素
function showHide( elements, show ) {
    var elem, display,
        values = [],
        index = 0,
        length = elements.length;
//对相关元素进行遍历
    for ( ; index < length; index++ ) {
        elem = elements[ index ];
        //若元素没有style，则跳过
        if ( !elem.style ) { 
            continue;
        }
        values[ index ] = jQuery._data( elem, "olddisplay" );
        // 如果要显示
        if ( show ) {

            // 将display设置为“”，来确定elem是否会显示
            // Reset the inline display of this element to learn if it is
            // being hidden by cascaded rules or not
            if ( !values[ index ] && elem.style.display === "none" ) {
                elem.style.display = "";
            }
            //若 display为""，且状态隐藏，则用css_defaultDisplay回复默认值
            // Set elements which have been overridden with display: none
            // in a stylesheet to whatever the default browser style is
            // for such an element
            if ( elem.style.display === "" && isHidden( elem ) ) {
                values[ index ] = jQuery._data( elem, "olddisplay", css_defaultDisplay(elem.nodeName) );
            }
        } else {
            display = curCSS( elem, "display" );
            //将当前display存入缓存
            if ( !values[ index ] && display !== "none" ) {
                jQuery._data( elem, "olddisplay", display );
            }
        }
    }

    //通过第二次进行设置display ，以避免不断回流
    // Set the display of most of the elements in a second loop
    // to avoid the constant reflow
    for ( index = 0; index < length; index++ ) {
        elem = elements[ index ];
        if ( !elem.style ) {
            continue;
        }
        if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
            elem.style.display = show ? values[ index ] || "" : "none";
        }
    }

    return elements;
}

//拓展方法
jQuery.fn.extend({
    css: function( name, value ) {
        //工具函数jQuery.access, 对this进行遍历，并执行参数中的函数. 读取或设置集合的属性值；支持全局的jquery.fn.css; jquery.fn.attr;jquery.fn.prop;  若有多个属性 则迭代处理
        return jQuery.access( this, function( elem, name, value ) {
            return value !== undefined ? //若value 不是undefined，则设值。若value不存在，则利用css进行取值
                jQuery.style( elem, name, value ) : //设置，value可以为空。 
                jQuery.css( elem, name );  //取值
        }, name, value, arguments.length > 1 );
    },
    show: function() { 
        return showHide( this, true );
    },
    hide: function() {
        return showHide( this );
    },
    //通过对state的判断，从而调用 show／hide 来实现toggle操作
    toggle: function( state, fn2 ) {
        var bool = typeof state === "boolean";

        if ( jQuery.isFunction( state ) && jQuery.isFunction( fn2 ) ) {
            return eventsToggle.apply( this, arguments );
        }

        return this.each(function() {
            if ( bool ? state : isHidden( this ) ) {
                jQuery( this ).show();
            } else {
                jQuery( this ).hide();
            }
        });
    }
});

//静态方法
jQuery.extend({
    // Add in style property hooks for overriding the default
    // behavior of getting and setting a style property
    //特别处理的属性，钩子函数。对某些特殊属性值进行读取方法。如 width／height会用到，
    cssHooks: {
        opacity: {
            get: function( elem, computed ) {
                if ( computed ) {
                    // We should always get a number back from opacity
                    var ret = curCSS( elem, "opacity" );
                    return ret === "" ? "1" : ret;

                }
            }
        }
    },

    //排除以下属性添加px
    // Exclude the following css properties to add px
    cssNumber: {
        "fillOpacity": true,
        "fontWeight": true,
        "lineHeight": true,
        "opacity": true,
        "orphans": true,
        "widows": true,
        "zIndex": true,
        "zoom": true
    },

    // Add in properties whose names you wish to fix before
    // setting or getting the value
    //浮动属性
    cssProps: {
        // normalize float css property
        "float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
    },

    // Get and set the style property on a DOM Node
    //styel 在DOM节点上 读取（节点上的styel）或设置样式属性
    style: function( elem, name, value, extra ) {
        // Don't set styles on text and comment nodes
        //elem不存在 ｜｜ 文本节点 text｜｜注释节点 comment｜｜elem没有样式  则返回 undefined
        if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
            return;
        }

        // Make sure that we're working with the right name
        var ret, type, hooks,
            origName = ,//驼峰化
            style = elem.style; //节点样式集
        //检查浏览器前缀，并且缓存再jQuery.cssProps中 ，对属性名进行对应浏览器命名设置   
        name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

        // gets hook for the prefixed version
        // followed by the unprefixed version
        //取hook
        hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

        //如果是设置
        // Check if we're setting a value
        if ( value !== undefined ) {
            type = typeof value;
            
            //下面3个if 都是对数字进行处理。 

            //如果是 string，计算相对值
            // convert relative number strings (+= or -=) to relative numbers. #7345
            if ( type === "string" && (ret = rrelNum.exec( value )) ) {
                value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
                // Fixes bug #9237
                type = "number";
            }

            //如果传入的是 number，则要过滤 null／NaN
            // Make sure that NaN and null values aren't set. See: #7116
            if ( value == null || type === "number" && isNaN( value ) ) {
                return;
            }

            //如果name不再jquery.cssNumber中（符合上面if判断的规则），则自动追加 px 单位，所以，可以通过在jQuery.cssNumber中添加属性的方式来修改这一行为
            // If a number was passed in, add 'px' to the (except for certain CSS properties)
            if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
                value += "px";
            }

        //如果有hook，且为设置，则调用hook的set方法，返回值赋给value。再将value给 styel［name］
            // If a hook was provided, use that value, otherwise just set the specified value
            if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
                // Wrapped to prevent IE from throwing errors when 'invalid' values are provided
                // Fixes bug #5509
                try {
                     //这个 try－catch是为了应为 IE中使用不合法的值设置样式。以便抛出异常
                    style[ name ] = value;
                } catch(e) {}
            }

        } else { 
            //如果有hook，且为读取，则调用get方法，并赋值给 ret
            // If a hook was provided get the non-computed value from there
            if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
                return ret;
            }

            // Otherwise just get the value from the style object
            //如果没有hook,则返回 style[name]
            return style[ name ];
        }
    },
   // css 是读取计算后的样式 （即渲染后的样式值），需要注意extra这个参数，是innerWidth／innerHeight这种方法对padding的额外处理。
    css: function( elem, name, numeric, extra ) {
        var val, num, hooks,
            origName = jQuery.camelCase( name );//样式名 驼峰化
        
        //与 style 一样，要先检查浏览器前缀
        // Make sure that we're working with the right name
        name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

        //判断是否是特殊样式
        // gets hook for the prefixed version
        // followed by the unprefixed version
        hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

        // 如果有hook，则调用get方法。因为要处理浏览器兼容问题，所以要走hook。如果是特殊样式，则通过hooks.get处理并返回结果。
        // If a hook was provided get the computed value from there
        if ( hooks && "get" in hooks ) {
            val = hooks.get( elem, true, extra );
        }
        //否则，通过curCSS返回结果
        // Otherwise, if a way to get the computed value exists, use that
        if ( val === undefined ) {
            val = curCSS( elem, name );
        }
        
        //转换 normal
        //convert "normal" to computed value
        if ( val === "normal" && name in cssNormalTransform ) {
            val = cssNormalTransform[ name ];
        }

        // Return, converting to number if forced or a qualifier was provided and val looks numeric
        if ( numeric || extra !== undefined ) {
            num = parseFloat( val );
            return numeric || jQuery.isNumeric( num ) ? num || 0 : val;
        }
        return val;   // 从这里可以看出，css是获取 val
    },

    // A method for quickly swapping in/out CSS properties to get correct calculations
    //用于对属性进行快速的计算处理，主要处理不可见的元素，有别与 curCss
    swap: function( elem, options, callback ) {
        var ret, name,
            old = {};

        //替换elem.style的属性
        // Remember the old values, and insert the new ones
        for ( name in options ) {
            old[ name ] = elem.style[ name ];
            elem.style[ name ] = options[ name ];
        }

        ret = callback.call( elem );

        // 重新换回原来的属性
        // Revert the old values
        for ( name in options ) {
            elem.style[ name ] = old[ name ];
        }

        return ret;
    }
});

// 根据浏览器的不同，计算样式也不同。主要对 宽高进行处理。尤其是IE中的 content／padding／border的尺寸总和，再FF中仅仅是content的尺寸
// NOTE: To any future maintainer, we've window.getComputedStyle
// because jsdom on node.js will break without it.
if ( window.getComputedStyle ) {
    curCSS = function( elem, name ) {
        var ret, width, minWidth, maxWidth,
            computed = window.getComputedStyle( elem, null ),
            style = elem.style;

        if ( computed ) {

            // getPropertyValue is only needed for .css('filter') in IE9, see #12537
            ret = computed.getPropertyValue( name ) || computed[ name ];

            if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
                ret = jQuery.style( elem, name );
            }

            // A tribute to the "awesome hack by Dean Edwards"
            // Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
            // Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
            // this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
            if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {
                width = style.width;
                minWidth = style.minWidth;
                maxWidth = style.maxWidth;

                style.minWidth = style.maxWidth = style.width = ret;
                ret = computed.width;

                style.width = width;
                style.minWidth = minWidth;
                style.maxWidth = maxWidth;
            }
        }

        return ret;
    };
} else if ( document.documentElement.currentStyle ) {
    curCSS = function( elem, name ) {
        var left, rsLeft,
            ret = elem.currentStyle && elem.currentStyle[ name ],
            style = elem.style;

        // Avoid setting ret to empty string here
        // so we don't default to auto
        if ( ret == null && style && style[ name ] ) {
            ret = style[ name ];//缓存结果
        }

        // From the awesome hack by Dean Edwards
        // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

        // If we're not dealing with a regular pixel number
        // but a number that has a weird ending, we need to convert it to pixels
        // but not position css attributes, as those are proportional to the parent element instead
        // and we can't measure the parent instead because it might trigger a "stacking dolls" problem
        if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

            //记录原始值
            // Remember the original values
            left = style.left;
            rsLeft = elem.runtimeStyle && elem.runtimeStyle.left;

            // Put in the new values to get a computed value out
            if ( rsLeft ) {
                elem.runtimeStyle.left = elem.currentStyle.left;
            }
            style.left = name === "fontSize" ? "1em" : ret;
            ret = style.pixelLeft + "px";

            // 回复更改值
            // Revert the changed values
            style.left = left;
            if ( rsLeft ) {
                elem.runtimeStyle.left = rsLeft;
            }
        }

        return ret === "" ? "auto" : ret;
    };
}

function setPositiveNumber( elem, value, subtract ) {
    var matches = rnumsplit.exec( value );
    return matches ?
        Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
        value;
}

//由于IE存在box模型的bug，所以再css3中以box－size来改善。augmentWidthOrHeight是专门针对box模型的处理。
function augmentWidthOrHeight( elem, name, extra, isBorderBox ) {
    var i = extra === ( isBorderBox ? "border" : "content" ) ?
            // If we already have the right measurement, avoid augmentation
            4 :
            // Otherwise initialize for horizontal or vertical properties
            name === "width" ? 1 : 0,

        val = 0;

    for ( ; i < 4; i += 2 ) {
        // both box models exclude margin, so add it if we want it
        if ( extra === "margin" ) {
            // we use jQuery.css instead of curCSS here
            // because of the reliableMarginRight CSS hook!
            //这里的cssExpand为全局定义［上下左右］的数组
            val += jQuery.css( elem, extra + cssExpand[ i ], true );
        }

        // From this point on we use curCSS for maximum performance (relevant in animations)
        if ( isBorderBox ) {
            // border-box includes padding, so remove it if we want content
            if ( extra === "content" ) {
                val -= parseFloat( curCSS( elem, "padding" + cssExpand[ i ] ) ) || 0;
            }

            // at this point, extra isn't border nor margin, so remove border
            if ( extra !== "margin" ) {
                val -= parseFloat( curCSS( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
            }
        } else {
            // at this point, extra isn't content, so add padding
            val += parseFloat( curCSS( elem, "padding" + cssExpand[ i ] ) ) || 0;

            // at this point, extra isn't content nor padding, so add border
            if ( extra !== "padding" ) {
                val += parseFloat( curCSS( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
            }
        }
    }

    return val;
}
//获取width height的方法
function getWidthOrHeight( elem, name, extra ) {

    // Start with offset property, which is equivalent to the border-box value
    var val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
        valueIsBorderBox = true,
        isBorderBox = jQuery.support.boxSizing && jQuery.css( elem, "boxSizing" ) === "border-box";

    // some non-html elements return undefined for offsetWidth, so check for null/undefined
    // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
    // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
    if ( val <= 0 || val == null ) {
        // Fall back to computed then uncomputed css if necessary
        val = curCSS( elem, name );
        if ( val < 0 || val == null ) {
            val = elem.style[ name ];
        }

        // Computed unit is not pixels. Stop here and return.
        if ( rnumnonpx.test(val) ) {
            return val;
        }

        // we need the check for style in case a browser which returns unreliable values
        // for getComputedStyle silently falls back to the reliable elem.style
        valueIsBorderBox = isBorderBox && ( jQuery.support.boxSizingReliable || val === elem.style[ name ] );

        // Normalize "", auto, and prepare for extra
        val = parseFloat( val ) || 0;
    }

    // use the active box-sizing model to add/subtract irrelevant styles
    return ( val +
        augmentWidthOrHeight(
            elem,
            name,
            extra || ( isBorderBox ? "border" : "content" ),
            valueIsBorderBox
        )
        ) + "px";
}


//设置默认显示样式
// Try to determine the default display value of an element
function css_defaultDisplay( nodeName ) {
    if ( elemdisplay[ nodeName ] ) {
        return elemdisplay[ nodeName ];
    }

    var elem = jQuery( "<" + nodeName + ">" ).appendTo( document.body ),
        display = elem.css("display");
    elem.remove();

    // If the simple way fails,
    // get element's real default display by attaching it to a temp iframe
    if ( display === "none" || display === "" ) {
        // Use the already-created iframe if possible
        iframe = document.body.appendChild(
            iframe || jQuery.extend( document.createElement("iframe"), {
                frameBorder: 0,
                width: 0,
                height: 0
            })
        );

        // Create a cacheable copy of the iframe document on first call.
        // IE and Opera will allow us to reuse the iframeDoc without re-writing the fake HTML
        // document to it; WebKit & Firefox won't allow reusing the iframe document.
        if ( !iframeDoc || !iframe.createElement ) {
            iframeDoc = ( iframe.contentWindow || iframe.contentDocument ).document;
            iframeDoc.write("<!doctype html><html><body>");
            iframeDoc.close();
        }

        elem = iframeDoc.body.appendChild( iframeDoc.createElement(nodeName) );

        display = curCSS( elem, "display" );
        document.body.removeChild( iframe );
    }

    // Store the correct default display
    elemdisplay[ nodeName ] = display;

    return display;
}
//对height 和 width 的hook
jQuery.each([ "height", "width" ], function( i, name ) {
    jQuery.cssHooks[ name ] = {
        get: function( elem, computed, extra ) {
            if ( computed ) {
                // certain elements can have dimension info if we invisibly show them
                // however, it must have a current display style that would benefit from this
                if ( elem.offsetWidth === 0 && rdisplayswap.test( curCSS( elem, "display" ) ) ) {
                    return jQuery.swap( elem, cssShow, function() {
                        return getWidthOrHeight( elem, name, extra );
                    });
                } else {
                    return getWidthOrHeight( elem, name, extra );
                }
            }
        },

        set: function( elem, value, extra ) {
            return setPositiveNumber( elem, value, extra ?
                augmentWidthOrHeight(
                    elem,
                    name,
                    extra,
                    jQuery.support.boxSizing && jQuery.css( elem, "boxSizing" ) === "border-box"
                ) : 0
            );
        }
    };
});

//处理浏览器对opactity，当浏览器不支持时
if ( !jQuery.support.opacity ) {
    jQuery.cssHooks.opacity = {
        get: function( elem, computed ) {
            //IE是否存在 filters 样式， 存在－》则 opacity与标准浏览器保持一致，＊0.01   不存在，未设置opacity，视为1
            // IE uses filters for opacity
            return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
                ( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
                computed ? "1" : "";
        },

        set: function( elem, value ) {
            var style = elem.style,
                currentStyle = elem.currentStyle,
                opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",  //为了 IE 与 非IE 保持一致，所以＊100
                filter = currentStyle && currentStyle.filter || style.filter || "";

            // IE has trouble with opacity if it does not have layout
            // Force it by setting the zoom level
            style.zoom = 1;

            // if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
            if ( value >= 1 && jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
                style.removeAttribute ) {

                // Setting style.filter to null, "" & " " still leave "filter:" in the cssText
                // if "filter:" is present at all, clearType is disabled, we want to avoid this
                // style.removeAttribute is IE Only, but so apparently is this code path...
                style.removeAttribute( "filter" );

                // if there there is no filter style applied in a css rule, we are done
                if ( currentStyle && !currentStyle.filter ) {
                    return;
                }
            }

            // otherwise, set new filter values
            style.filter = ralpha.test( filter ) ?
                filter.replace( ralpha, opacity ) :
                filter + " " + opacity;
        }
    };
}



//在DOM加载后，利用hook处理bug
// These hooks cannot be added until DOM ready because the support test
// for it is not run until after DOM ready
jQuery(function() {
    if ( !jQuery.support.reliableMarginRight ) {
        jQuery.cssHooks.marginRight = {
            get: function( elem, computed ) {
                // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
                // Work around by temporarily setting element display to inline-block
                return jQuery.swap( elem, { "display": "inline-block" }, function() {
                    if ( computed ) {
                        return curCSS( elem, "marginRight" );
                    }
                });
            }
        };
    }

    // Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
    // getComputedStyle returns percent when specified for top/left/bottom/right
    // rather than make the css module depend on the offset module, we just check for it here
    if ( !jQuery.support.pixelPosition && jQuery.fn.position ) {
        jQuery.each( [ "top", "left" ], function( i, prop ) {
            jQuery.cssHooks[ prop ] = {
                get: function( elem, computed ) {
                    if ( computed ) {
                        var ret = curCSS( elem, prop );
                        // if curCSS returns percentage, fallback to offset
                        return rnumnonpx.test( ret ) ? jQuery( elem ).position()[ prop ] + "px" : ret;
                    }
                }
            };
        });
    }

});

//处理DOM元素是否占据布局空间即  offsetWidth／offsetHeight 是否为0。［这里需要注意visibility:hidden 或 opacity 为0时，元素依然占据布局空间］
if ( jQuery.expr && jQuery.expr.filters ) {
    jQuery.expr.filters.hidden = function( elem ) {
        //如果 offsetWidth 与 offsetHeight 不可靠， 则进一步通过 display＝none来确定
        return ( elem.offsetWidth === 0 && elem.offsetHeight === 0 ) || (!jQuery.support.reliableHiddenOffsets && ((elem.style && elem.style.display) || curCSS( elem, "display" )) === "none");
    };

//通过对伪类过滤函数 jQuery.expr.filters.hidden(elem)的结果取反，来确定元素是否占据布局空间
    jQuery.expr.filters.visible = function( elem ) {
        return !jQuery.expr.filters.hidden( elem );
    };
}

//这里是对应动画时处理特殊属性的方法。这里需要注意的是，jquery对于隐藏元素的处理
// These hooks are used by animate to expand properties
jQuery.each({
    margin: "",
    padding: "",
    border: "Width"
}, function( prefix, suffix ) {
    jQuery.cssHooks[ prefix + suffix ] = {
        expand: function( value ) {
            var i,

            // assumes a single number if not a string
                parts = typeof value === "string" ? value.split(" ") : [ value ],
                expanded = {};

            for ( i = 0; i < 4; i++ ) {
                expanded[ prefix + cssExpand[ i ] + suffix ] =
                    parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
            }

            return expanded;
        }
    };

    if ( !rmargin.test( prefix ) ) {
        jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
    }
});