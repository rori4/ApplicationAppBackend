let order = (() => {
        function loadSortableCategory() {
            if (document.getElementById('categoriesOrder')) {
                console.log("Tried");
                var el = document.getElementById('categoriesOrder');
                console.log(el);
                var sortable = Sortable.create(el, {
                    // Element dragging ended
                    onEnd: function (/**Event*/evt) {
                        var itemEl = evt.item;  // dragged HTMLElement
                        console.log(evt.oldIndex);
                        console.log(evt.newIndex);
                        remote.changeCategoryOrder(evt.oldIndex, evt.newIndex);
                    },
                });


            } else {
                console.log("failed");
                setTimeout(loadSortableCategory, 15);
            }
        }

        function loadSortableImages(categoryId) {
            if (document.getElementById('imagesOrder')) {
                console.log("Tried");
                var el = document.getElementById('imagesOrder');
                console.log(el);
                var sortable = Sortable.create(el, {
                    // Element dragging ended
                    onEnd: function (/**Event*/evt) {
                        var itemEl = evt.item;  // dragged HTMLElement
                        console.log(evt.oldIndex);
                        console.log(evt.newIndex);
                        remote.changeImageOrder(categoryId, evt.oldIndex, evt.newIndex);
                    },
                });


            } else {
                console.log("failed");
                setTimeout(loadSortableImages, 15);
            }
        }

        return {
            loadSortableCategory,
            loadSortableImages
        }
    }
)();
// loadSortable();