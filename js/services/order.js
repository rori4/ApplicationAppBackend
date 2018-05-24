$( document ).ready(function() {
    console.log("LOADED")
    $('#categoriesOrder').dragsort({
        drop_exchange:0,
        onDrag:function(item){
//                console.log('drag!',item);
        },
        onDragStart:function(item){
//                console.log('drag start!',item);
        },
        onContact:function(item,exitem){
            console.log("contact! DRAGGED",item,"TOUCHED",exitem);
        },
        onExchange:function(item,exitem){
            console.log("exchange! DRAGGED",item,"REPLACED",exitem);
        },
        onDrop:function(item){
//                console.log('drop!',item);
        }
    });
});
