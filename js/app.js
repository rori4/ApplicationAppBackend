$(() => {
    const app = Sammy('#app', function () {
        this.use('Handlebars', 'hbs');

        this.get('index.html', getWelcomePage);

        this.get('#category/:id',(ctx) => {
            let categoryId = ctx.params.id;
            remote.getCategoryById(categoryId, function (category) {
                ctx.images = category.images;
                ctx.category = categoryId;
                ctx.loadPartials({
                    navigation: './templates/common/navigation.hbs',
                    header: './templates/common/header.hbs',
                    addCategory: './templates/forms/addCategory.hbs'
                }).then(function () {
                    this.partial('./templates/categoryImages.hbs').then(()=>{
                        order.loadSortableImages(categoryId);
                    });
                })
            })
        });

        function getWelcomePage(ctx) {
            remote.getAllCategories(function (categories) {
                ctx.categories = categories;
                console.log(ctx.categories);

                ctx.loadPartials({
                    navigation: './templates/common/navigation.hbs',
                    header: './templates/common/header.hbs',
                    addCategory: './templates/forms/addCategory.hbs'
                }).then(function () {
                    this.partial('./templates/categories.hbs').then(()=>{
                        order.loadSortableCategory();
                    });
                })
            });
        }

    });

    app.run();
});