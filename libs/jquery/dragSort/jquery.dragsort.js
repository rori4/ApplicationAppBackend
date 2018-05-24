/*!
 * dragsort v0.1
 * update 20170728
 */
(function($) {
    "use strict";
    var plugin_name='dragsort';
    if(typeof($.fn[plugin_name])=='function'){
        return false;
    }

    var struct_class={
        container:plugin_name+'_container',

        img_add_btn:plugin_name+'_img_add_btn',

        img_editor:plugin_name+'_img_editor',
        draggable_item:plugin_name+'_draggable_item',
        dragged_item:plugin_name+'_dragged_item',


        img_del_btn:plugin_name+'_img_del_btn',

        preview_image:plugin_name+'_preview_image'

    };
    var status_class={
        dragstart:plugin_name+'_dragstart'
    };
    var default_class={
        draggable_item:plugin_name+'_draggable_item'
    };
    var active_class='draggable-active';
    var collision_grid_class='draggable-debug-collision-grid';

    var current_drag_obj;/*å½“å‰æ“ä½œçš„å®¹å™¨*/

    /*æ ·å¼*/
    $('head').append('<style>' +
        '.'+struct_class.draggable_item+'{' +
        'position:relative;top:0;left:0' +
        '}'+
        '.'+struct_class.container+'{' +
        '-webkit-user-select: none;' +
        ' -moz-user-select: none;' +
        ' -ms-user-select: none;' +
        ' -o-user-select: none;' +
        '}' +
        '</style>');

    /*ç”Ÿæˆä¸€ä¸ªæ•°å­—åŒºé—´ä¸­æ‰€æœ‰çš„æ•°å­—*/
    function _range(min,max){
        var re=[];
        for(var i=max;i>=min;i--){
            re.push(i);
        }
        return re;
    }
    /*å¿«é€Ÿè°ƒç”¨å‡½æ•°*/
    function _qcall(f,t){
        var args = Array.prototype.slice.call(arguments,2);
        if (typeof(f)=='function') f.apply(t,args);
    }
    /*ç‚¹å’ŒçŸ©å½¢çš„ç¢°æ’žæ£€æµ‹*/
    function check_collision(point,list){
        var met=false;
        $.each(list,function(i,v){
            var is_x=false;
            var is_y=false;
            if(typeof(point.x)=='undefined'){
                is_x=true;/*æœªå®šä¹‰xåæ ‡æ—¶xçš„åˆ¤æ–­å›ºå®šä¸ºtrue*/
            }else{
                is_x=point.x>=v.min_x && point.x<=v.max_x;
            }
            if(typeof(point.y)=='undefined'){
                is_y=true;/*æœªå®šä¹‰yåæ ‡æ—¶yçš„åˆ¤æ–­å›ºå®šä¸ºtrue*/
            }else{
                is_y=point.y>=v.min_y && point.y<=v.max_y;
            }
            if(is_x && is_y){
                met= v;
                return false;
            }
        });
        //console.log('ç¢°æ’žæ£€æµ‹ :'+count+'æ¬¡');
        return met;
    }
    /*ç‚¹æ‰€åœ¨ç½‘æ ¼çš„çŸ©å½¢ç­›é€‰*/
    function check_grid(point){
        var met_list=[];
        var met_x=[],met_y=[];
        var check_x=typeof(point.x)!='undefined';
        var check_y=typeof(point.y)!='undefined';
        if(check_x){
            met_x=current_drag_obj.droppable_area_list['x'+Math.floor(point.x/current_drag_obj.options.collision_grid_width)] || [];
            if(met_x.length==0) return false;/*æ— åŒ¹é…*/
            if(!check_y) return met_x;/*å¦‚æžœä¸åˆ¤æ–­y,åˆ™ç›´æŽ¥è¿”å›žx*/
        }
        if(check_y){
            met_y=current_drag_obj.droppable_area_list['y'+Math.floor(point.y/current_drag_obj.options.collision_grid_width)] || [];
            if(met_y.length==0) return false;/*æ— åŒ¹é…*/
            if(!check_x) return met_y;/*å¦‚æžœä¸åˆ¤æ–­x,åˆ™ç›´æŽ¥è¿”å›žy*/
        }
        var count=0;
        if(met_x.length>0 && met_y.length>0){ /*xyéƒ½æœ‰åŒ¹é…çš„*/
            $.each(met_x,function(ky,vy){
                $.each(met_y,function(kx,vx){
                    count++;
                    if(vx.dom_index==vy.dom_index){ /*åˆ¤æ–­å’Œyè½´åŒ¹é…çš„ç»“æžœæ˜¯å¦ä¸€è‡´*/
                        met_list.push(vy);
                    }
                });
            });
        }else{
            console.log('todo: what\'s this info?',met_x,met_y);
        }
        //console.log('ç½‘æ ¼ä¸­çš„å¯ç¢°æ’žåŒºåŸŸæ£€æµ‹ :'+count+'æ¬¡ ');

        return met_list.length>0?met_list:false;
    }
    function check_met(){
        var that=this;
        var options=this.options;
        /*ç¢°æ’žæ£€æµ‹*/
        var center_coord={};/*æ‹–åŠ¨å…ƒç´ çš„ä¸­å¿ƒåæ ‡*/
        var new_pos=that.dragged_item.offset();
        center_coord.x=new_pos.left+that.dragged_item_width/2;
        center_coord.y=new_pos.top+that.dragged_item_height/2;
        var met;
        if(options.collision_grid){ /*ä½¿ç”¨ç½‘æ ¼ä¼˜åŒ–çš„ç¢°æ’žæ£€æµ‹æ–¹æ¡ˆ*/
            met=check_grid(center_coord);
        }else{/*å…¨éƒ¨éåŽ†çš„ç¢°æ’žæ£€æµ‹æ–¹æ¡ˆ*/
            met=that.droppable_area_list;
        }
        if(met) met=check_collision(center_coord,met);
        return met;
    }

    function update_collision_area(){
        var plugin=this;
        var options=this.options;
        var map={};
        if(options.draggableItemClass){
            plugin.draggable_item_list=$('.'+options.draggableItemClass,plugin.element);
        }else{
            plugin.draggable_item_list=plugin.element.children();
        }
        plugin.draggable_item_list.addClass(struct_class.draggable_item);/*éœ€è¦è¢«æ‹–åŠ¨çš„ç‰©ä»¶,åŠ ä¸Šclassæ ‡è®°*/
        plugin.draggable_item_list.each(function(i){
            var that=$(this);
            if (that.hasClass(struct_class.dragged_item)){
                /*è·³è¿‡è¢«æ‹–åŠ¨çš„å…ƒç´ */
            }else{
                var info={};
                var offset=that.offset();
                info.min_x=offset.left;
                info.max_x=offset.left+that.outerWidth();
                info.min_y=offset.top;
                info.max_y=offset.top+that.outerHeight();
                info.dom_index=i;

                if(options.collision_grid){ /*ä¼˜åŒ–ç¢°æ’žæ£€æµ‹çš„ç½‘æ ¼,ç”Ÿæˆç´¢å¼•*/
                    var grid_width=options.collision_grid_width;
                    var x_range=_range(Math.floor(info.min_x/grid_width),Math.floor(info.max_x/grid_width));
                    var y_range=_range(Math.floor(info.min_y/grid_width),Math.floor(info.max_y/grid_width));
                    $.each([[x_range,'x'],[y_range,'y']],function(k,v){
                        $.each(v[0],function(kk,vv){
                            var key=v[1]+vv;
                            if(!map[key]) map[key]=[];
                            map[key].push(info);
                        });
                    });
                }else{
                    if(typeof(map.push)!='function') map=[];
                    map.push(info);
                }
            }
        });
        //if(current_drag_obj.options.collision_grid) {
        //    var mapl= 0,mapd=0;
        //    $.each(map,function(k,v){
        //        mapl++;
        //        mapd+= v.length;
        //    });
        //    console.log('æœ¬æ¬¡æ›´æ–°ä¸€å…±æœ‰:'+mapl+'ä¸ªç½‘æ ¼,ç½‘æ ¼è¾¹é•¿:'+current_drag_obj.options.collision_grid_width+'px,'+mapd+'ä¸ªå¯ç¢°æ’žåŒºåŸŸ');
        //}
        plugin.droppable_area_list=map;
    }

    /*æ‹–åŠ¨å¼€å§‹*/
    function drag_start(){
        var that=this;
        var options=this.options;
        if(that.dragstart) return;
        that.dragstart=1;

        if(options.placeholderClass){/*æ‹–èµ°ä¹‹åŽçš„æ˜¾ç¤ºåœ¨åŽŸä½ç½®çš„å…ƒç´ */
            that.placeholder = $('<div></div>');
            that.placeholder.addClass(options.placeholderClass);
            that.placeholder.css({
                top: that.dragged_item.offset().top - that.element.offset().top,
                left: that.dragged_item.offset().left - that.element.offset().left,
                width: that.dragged_item.outerWidth() - 10,
                height: that.dragged_item.outerHeight() - 10,
                lineHeight: that.dragged_item.height() - 18 + 'px',
                textAlign: 'center'
            });
            that.element.append(that.placeholder);
        }

        _qcall(options.onDragStart,that,that.dragged_item);
    }
    /*æ›´æ–°æ‹–åŠ¨å…ƒç´ çš„ä½ç½®*/
    function update_dragged_item_position(e){
        var that=this;
        var options=this.options;
        var new_css={};
        if(options.axis!='y'){ /*æœªè®¾ç½®ä»…é™ç«–ç›´æ–¹å‘,åˆ™å¯åœ¨æ°´å¹³æ–¹å‘ä¸Šæ‹–åŠ¨*/
            new_css.left=e.pageX-that.drag_start_coord.x;
        }
        if(options.axis!='x'){ /*æœªè®¾ç½®ä»…é™æ°´å¹³æ–¹å‘,åˆ™å¯åœ¨ç«–ç›´æ–¹å‘ä¸Šæ‹–åŠ¨*/
            new_css.top=e.pageY-that.drag_start_coord.y;
        }
        /*æ–°çš„ä½ç½®*/
        that.dragged_item.css(new_css);
    }
    /*æ‹–åŠ¨å…ƒç´ ä¸ŽæŽ¥è§¦å…ƒç´ äº¤æ¢ä½ç½®*/
    function exchange(e){
        var that=this;
        var options=this.options;
        var cover_item=this.draggable_item_list.eq(this.drag_cover_index);
        if(cover_item.length==0) return;

        var old_offset=that.dragged_item.offset();/*æ¢ä½ä¹‹å‰çš„ä½ç§»*/
        /*å¦‚æžœç›®æ ‡åŒºåŸŸä¹‹å‰æœ‰è¢«æ‹–ä½çš„å…ƒç´ ï¼Œåˆ™æ–°ä½ç½®æ”¾åœ¨ç›®æ ‡åŒºåŸŸä¹‹åŽï¼Œå¦åˆ™å°±æ”¾åœ¨ä¹‹å‰*/
        var search_prev=cover_item.prevAll('.'+struct_class.dragged_item);
        if (search_prev.length>0){
            cover_item.after(that.dragged_item);
        } else {
            cover_item.before(that.dragged_item);
        }
        var new_offset=that.dragged_item.offset();/*æ¢ä½ä¹‹åŽçš„ä½ç§»*/
        /*æ›´æ–°é¼ æ ‡åˆæ¬¡ç‚¹å‡»åæ ‡*/
        that.drag_start_coord.x+=new_offset.left-old_offset.left;
        that.drag_start_coord.y+=new_offset.top-old_offset.top;

        update_dragged_item_position.call(that,e);

        _qcall(options.onExchange,that,that.dragged_item,cover_item);

        update_collision_area.call(that);/*å¦‚æžœæœ‰ç¢°æ’ž,åˆ™æ›´æ–°ç¢°æ’žæ£€æµ‹åŒºåŸŸ*/
    }
    /*æ‹–åŠ¨ç»“æŸ*/
    function drag_end() {
        var that=this;
        var options=this.options;
        that.dragged_item.removeClass(struct_class.dragged_item);/*åŽ»æŽ‰è¢«æ‹–ä½çš„æ ‡è®°*/

        _qcall(options.onDragEnd,that,that.dragged_item);

        that.dragged_item=false;
        current_drag_obj=false;

        if(current_drag_obj.placeholder){
            current_drag_obj.placeholder.remove();
            current_drag_obj.placeholder = false;
        }
    }


    /**
     * æ’ä»¶ä¸»ç±»,å®¹å™¨ç®¡ç†å™¨
     * @param element å®¹å™¨å…ƒç´
     * @param opt è‡ªå®šä¹‰é…ç½®
     */
    function Container(element, opt){
        var options = $.extend(true,{}, Container.DEFAULTS);
        if(opt) $.extend(options, opt);
        this.options=options;
        this.element=element;

        var that=this;
        var items_except=[];
        if(options.placeholderClass){
            items_except.push('.'+options.placeholderClass);
        }
        if(options.show_collision_grid){ /*TODO::ç ”ç©¶ç”¨*/
            items_except.push('.'+collision_grid_class);
            that.collision_grid=$('<div class="'+collision_grid_class+'" style="width:100%;height:100%;position:absolute;left:0;top:0;pointer-events:none;"></div>');
            element.append(that.collision_grid);
        }
        if(items_except){
            options.items=options.items+':not('+items_except.join(',')+')';
        }

        if(element.css('position')=='static') element.css('position','relative');
        element.addClass(struct_class.container);/*ä¸»å®¹å™¨çš„class*/
        /*åˆå§‹åŒ–æ—¶çš„å¯ç”¨,ç¦ç”¨*/
        if (options.active == true) element.addClass(active_class);

        update_collision_area.call(that);/*é‡æ–°è®¡ç®—å¯æ‹–æ”¾åŒºåŸŸåæ ‡*/

        /*èŽ·å–å¯æ‹–åŠ¨å…ƒç´ */
        function get_dragged_item(target){
            var dragged_area={length:0},
                dragged_item={length:0};
            if(target.hasClass(struct_class.container)) return dragged_item;
            if(options.draggableAreaClass){
                if(target.hasClass(options.draggableAreaClass)){
                    dragged_area=target;
                }else{
                    dragged_area=target.closest('.'+options.draggableAreaClass);
                }
                if(dragged_area.length>0){
                    if(options.draggableItemClass){
                        dragged_item=target.closest('.'+options.draggableItemClass);
                    }else{
                        dragged_item=target.parentsUntil('.'+struct_class.container).last();
                    }
                }

            }else{
                dragged_area=target;
                if(options.draggableItemClass){
                    if(target.hasClass(options.draggableItemClass)){
                        dragged_item=target;/*é€‰ä¸­draggableItem*/
                    }else{

                    }
                }else{ /*ä½¿ç”¨containerä¸‹ä¸€çº§å­å…ƒç´ ä½œä¸ºdraggableItem*/
                    if(target.parent().hasClass(struct_class.container)){
                        dragged_item=target;
                    }else{
                        dragged_item=target.parentsUntil('.'+struct_class.container).last();
                    }
                }
            }
            return dragged_item;
        }
        element
            .off('mousedown.'+plugin_name+' touchstart.'+plugin_name)
            .on('mousedown.'+plugin_name+' touchstart.'+plugin_name,function(e){

                if (that.dragged_item /*å·²å­˜åœ¨æ‹–èµ·çš„å…ƒç´ */ ||
                    e.which!=1 /*ç‚¹å‡»çš„ä¸æ˜¯é¼ æ ‡å·¦é”®*/ ||
                    !options.active) return ;

                var target=$(e.target);
                var dragged_item=get_dragged_item.call(that,target);
                if(dragged_item.length==0) return;/*æ²¡æœ‰èŽ·å–åˆ°æ‹–åŠ¨å…ƒç´ */

                _qcall(options.onDrag,that,dragged_item);

                element.addClass(status_class.dragstart);/*å®¹å™¨è¿›å…¥æ‹–åŠ¨çŠ¶æ€çš„class*/
                dragged_item.addClass(struct_class.dragged_item);/*æ·»åŠ è¢«æ‹–ä½çš„æ ‡è®°*/

                update_collision_area.call(that);/*é‡æ–°è®¡ç®—å¯æ‹–æ”¾åŒºåŸŸåæ ‡*/

                /*æ‹–åŠ¨å¼€å§‹çš„é¼ æ ‡ç‚¹å‡»ä½ç½®*/
                that.drag_start_coord.x = e.pageX;
                that.drag_start_coord.y = e.pageY;

                /*å…ƒç´ å¼€å§‹æ‹–åŠ¨çš„ä¸­å¿ƒåæ ‡*/
                that.dragged_item_width=dragged_item.outerWidth();
                that.dragged_item_height=dragged_item.outerHeight();

                that.draggable=1;/*å…è®¸æ‹–åŠ¨*/
                that.dragstart=0;/*å¼€å§‹æ‹–åŠ¨çš„çŠ¶æ€æ ‡è®°*/

                that.dragged_item=dragged_item;
                current_drag_obj=that;
            });
    }

    Container.prototype = {
        draggable:0,
        dragstart:0,

        drag_start_coord:{},
        dragged_item_width:0,
        dragged_item_height:0,

        draggable_item_list:{},
        droppable_area_list:[] /*TODO::ç¢°æ’žæ£€æµ‹*/
    };

    Container.DEFAULTS = {
        draggableItemClass:false,
        draggableAreaClass:false,/*è‡ªå®šä¹‰å¯æ‹–åŠ¨åŒºåŸŸï¼Œéœ€è¦åœ¨itemså†…éƒ¨*/

        placeholderClass:'',
        active: true,
        axis: false,
        resetTime:300,
        drop_exchange:1,


        collision_grid:false,
        collision_grid_width:100,
        show_collision_grid:0,
        onDrag:function(dragged_item){
            /*æŠ“èµ·è¿˜æœªç§»åŠ¨æ—¶çš„äº‹ä»¶*/
        },
        onDragStart:function(dragged_item){
            /*æŠ“èµ·å¹¶åˆšå¼€å§‹ç§»åŠ¨æ—¶çš„äº‹ä»¶*/
        },
        onContact:function(dragged_item){

        },
        onExchange:function(dragged_item,change_item){
            /*å…ƒç´ ä½ç½®å‘ç”Ÿå˜åŒ–æ—¶çš„äº‹ä»¶*/
        },
        onDrop:function(result_item){
            /*æ”¾ä¸‹å¹¶ä¸”å…ƒç´ æ—¶çš„äº‹ä»¶*/
        },
        onDragEnd:function(){

        }
    };


    var API = {
        enable: function() {
            this.options.active = true;
            if (!this.element.hasClass(active_class)) {
                this.element.addClass(active_class)
            }
        },
        disable: function (){
            this.options.active = false;
            this.element.removeClass(active_class);
        }
    };
    /*å…¨å±€äº‹ä»¶*/
    $(window)
        .on('mousemove.'+plugin_name,function(e) {
            /*é¼ æ ‡ç§»åŠ¨æ—¶æ‹–åŠ¨ç‰©ä»¶ TODO::ä¼˜åŒ–,é™ä½Žcpuä½¿ç”¨é‡*/
            if(current_drag_obj && current_drag_obj.draggable && current_drag_obj.dragged_item){
                var options=current_drag_obj.options;

                //current_drag_obj.x = e.pageX;
                //current_drag_obj.y = e.pageY;
                drag_start.call(current_drag_obj);

                update_dragged_item_position.call(current_drag_obj,e);

                /*åˆ¤æ–­æ˜¯å¦æŽ¥è§¦*/
                var met=check_met.call(current_drag_obj);
                if(met){
                    if(current_drag_obj.drag_cover_index!=met.dom_index){
                        /*é¦–æ¬¡æŽ¥è§¦*/
                        current_drag_obj.drag_cover_index=met.dom_index;
                        var cover_item=current_drag_obj.draggable_item_list.eq(current_drag_obj.drag_cover_index);
                        _qcall(options.onContact,
                            current_drag_obj,
                            current_drag_obj.dragged_item,
                            cover_item
                        );
                        if(options.drop_exchange){
                            current_drag_obj.draggable_item_list.filter('.covered').removeClass('covered');
                            cover_item.addClass('covered');
                        }else{
                            exchange.call(current_drag_obj,e);
                        }
                    }
                }else{
                    if(current_drag_obj.drag_cover_index>0){
                        /*é¦–æ¬¡åˆ†ç¦»*/
                        current_drag_obj.draggable_item_list.removeClass('covered');
                    }
                    current_drag_obj.drag_cover_index='t';/*éšä¾¿è®¾ç½®ä¸€ä¸ªstring*/
                }
            }
        })
        .on('mouseup.'+plugin_name,function(e){

            /*é¼ æ ‡æ¾å¼€æ—¶å¤ä½ç‰©ä»¶*/
            if(current_drag_obj && current_drag_obj.draggable && current_drag_obj.dragged_item){
                current_drag_obj.draggable=0;/*ç¦æ­¢æ‹–åŠ¨*/

                var options=current_drag_obj.options;

                _qcall(options.onDrop,current_drag_obj,current_drag_obj.dragged_item);

                if(options.drop_exchange && current_drag_obj.drag_cover_index>0){
                    exchange.call(current_drag_obj,e);
                }

                //if ($.contains(current_drag_obj.element[0], current_drag_obj.dragged_item[0])) {
                current_drag_obj.dragged_item.animate(
                    {
                        left: 0,
                        top: 0
                    },
                    current_drag_obj.options.resetTime,
                    function(){
                        drag_end.call(current_drag_obj);
                    }
                );
                //} else {
                /*TODO::æ‹–åˆ°å®¹å™¨å¤–é¢äº†*/
                //current_drag_obj.dragged_item.fadeOut(current_drag_obj.options.resetTime,drag_end);
                //}


            }

            if(current_drag_obj) current_drag_obj.element.removeClass(status_class.dragstart);/*åŽ»æŽ‰å®¹å™¨æ‹–åŠ¨çŠ¶æ€çš„clss*/
        });
    /**
     * å…¥å£æ–¹æ³•
     * @param methodOrOptions å‚æ•°è¯´æ˜Ž:
     * @returns {*}
     */
    $.fn[plugin_name] = function(methodOrOptions) {
        var args = Array.prototype.slice.call(arguments, 1);
        var re=[];
        var el=this.each(function(){
            var $t = $(this),
                plugin_instance = $t.data(plugin_name);
            if(plugin_instance && API[methodOrOptions]){
                re.push(API[methodOrOptions].apply(plugin_instance, args));
            }else if(!plugin_instance){
                $t.data(plugin_name, new Container($t, methodOrOptions));
            }
        });

        return re.length>0?(re.length==1?re[0]:re):el;
    };
})(jQuery);