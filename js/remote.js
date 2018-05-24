let remote = (() => {
    function uploadToFirebase() {
        let storageRef = firebase.storage().ref();
        let category = $('#category').val();
        let files = $('#images')[0].files;
        let title = $('#title').val();
        let description = $('#description').val();
        let freeImages = $('#freeImages').val();
        let currentID = 0;
        if (category === '') {
            alert("category can't be blank");
            return;
        }
        if (files.length === 0) {
            alert("please select files");
            return;
        }
        // Create a root reference
        firebase.auth().signInWithEmailAndPassword("rangelstoilov@gmail.com", "dqpkn65").catch(function (error) {
            // Handle Errors here.
            let errorCode = error.code;
            let errorMessage = error.message;
            alert(errorMessage);
            // ...
        });

        getCurrentId(function (id) {
            console.log("ID GOT: " + id);
            addCategory(id, category, title, description, freeImages);
            uploadFiles(files, id, storageRef)
        });
    }

    function uploadFiles(files, categoryId, storageRef) {
        let x = 0;
        let loopArray = function (arr) {
            editAndUploadFile(arr[x], categoryId, storageRef, function () {
                // set x to next item
                x++;

                // any more items in array? continue loop
                if (x < arr.length) {
                    loopArray(arr);
                }
            });
        }

        loopArray(files);

        //
        // Array.from(files).forEach(file => {
        //     console.log("Array time" + i);
        //     i++;
        //     //Convert Image to thumb
        //     //Get common ID for image
        //
        //     });
    }

    function changeCategoryOrder(oldId, newId) {
        let categoryRef = firebase.database().ref('categories');
        categoryRef.child(oldId).once('value').then(function (snap) {
            let snapshot = snap.val();

            console.log(snapshot);
            if (oldId < newId) {
                for (let i = oldId; i < newId; i++) {
                    console.log(i+1);
                    categoryRef.child(i+1).once('value').then(function (snap) {
                        let data = snap.val();
                        console.log("Here: " + i);
                        console.log(categoryRef.child(i-1));
                        categoryRef.child(i).update(data);
                    });
                }
            } else {
                for (let i = oldId; i > newId; i--) {
                    console.log(i-1);
                    categoryRef.child(i-1).once('value').then(function (snap) {
                        let data = snap.val();
                        console.log("Here: " + i);
                        console.log(categoryRef.child(i+1));
                        categoryRef.child(i).update(data);
                    });
                }
            }
            categoryRef.child(newId).update(snapshot);
        });

    }

        function changeImageOrder(cat, oldId, newId) {
        console.log("We are here: " + cat);
            let imageRef = firebase.database().ref('categories/'+cat+'/images');
            console.log(imageRef);
            imageRef.child(oldId).once('value').then(function (snap) {
                let snapshot = snap.val();

                console.log("new: " + snapshot);
                if (oldId < newId) {
                    for (let i = oldId; i < newId; i++) {
                        console.log(i+1);
                        imageRef.child(i+1).once('value').then(function (snap) {
                            let data = snap.val();
                            console.log("Here: " + i);
                            console.log(imageRef.child(i-1));
                            imageRef.child(i).update(data);
                        });
                    }
                } else {
                    for (let i = oldId; i > newId; i--) {
                        console.log(i-1);
                        imageRef.child(i-1).once('value').then(function (snap) {
                            let data = snap.val();
                            console.log("Here: " + i);
                            console.log(imageRef.child(i+1));
                            imageRef.child(i).update(data);
                        });
                    }
                }
                imageRef.child(newId).update(snapshot);
            });

        }



    function getAllCategories(callback) {
        firebase.database().ref('categories/').once("value", function (snapshot) {
            console.log(snapshot.val());
            callback(snapshot.val())
        })
    }

    function getCategoryById(id, callback) {
        console.log(id);
        firebase.database().ref('categories/'+id).on("value", function (snapshot) {
            console.log(snapshot.val());
            callback(snapshot.val())
        })
    }

    function editAndUploadFile(file, categoryId, storageRef, callback) {
        getImageCurrentId(categoryId, function (imageId) {
            // Create the file metadata

            var metadata = {
                contentType: 'image/png'
            };
            // Upload file and metadata to the object 'images/mountains.jpg'
            var uploadTask = storageRef.child('images/' + file.name).put(file, metadata);

            // Listen for state changes, errors, and completion of the upload.
            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                function (snapshot) {
                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED: // or 'paused'
                            console.log('Upload is paused');
                            break;
                        case firebase.storage.TaskState.RUNNING: // or 'running'
                            console.log('Upload is running');
                            break;
                    }
                }, function (error) {

                    // A full list of error codes is available at
                    // https://firebase.google.com/docs/storage/web/handle-errors
                    switch (error.code) {
                        case 'storage/unauthorized':
                            // User doesn't have permission to access the object
                            alert(error.message);
                            break;
                        case 'storage/canceled':
                            // User canceled the upload
                            alert(error.message);
                            break;
                        case 'storage/unknown':
                            // Unknown error occurred, inspect error.serverResponse
                            alert(error.message);
                            break;
                    }
                }, function () {
                    // Upload completed successfully, now we can get the download URL
                    uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                        console.log('File available at', downloadURL);
                        writeImagesToCategory(categoryId, imageId, downloadURL);
                        callback();
                    });
                });
        });
    }


    function writeImagesToCategory(categoryId, imageId, downloadURL) {
        firebase.database().ref('categories/' + categoryId + '/images/' + imageId).update({
            transparencyTolerance: "90",
            big: downloadURL
        });
    }

    function getCurrentId(callback) {
        firebase.database().ref('categories/').orderByKey().limitToLast(1).once("value", function (snapshot) {
            console.log(snapshot.numChildren());
            if (snapshot.numChildren() > 0) {
                snapshot.forEach(function (child) {
                    callback(parseInt(child.key) + 1);
                });
            } else {
                callback(0);
            }
        })
    }

    function getImageCurrentId(category, callback) {
        console.log("THIS IS CAT: " + category);
        firebase.database().ref('categories/' + category + '/images').orderByKey().limitToLast(1).once("value", function (snapshot) {
            console.log(snapshot.numChildren());
            if (snapshot.numChildren() > 0) {
                snapshot.forEach(function (child) {
                    console.log(parseInt(child.key));
                    callback(parseInt(child.key) + 1);
                });
            } else {
                callback(0);
            }
        })
    }


    function addCategory(id, category, title, description, freeImages) {
        firebase.database().ref('categories/' + id).update({
            title: category,
            product: {
                title: title,
                id: id,
                description: description,
                freeImages: freeImages
            }
        });
    }
        return {
            uploadToFirebase,
            getAllCategories,
            changeCategoryOrder,
            getCategoryById,
            changeImageOrder
        }
    }

)();