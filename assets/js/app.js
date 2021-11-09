// declaration of varaibles
const bucketName = 'storage-textract';
const bucketRegion = 'us-west-2';
const IdentityPoolId = 'us-west-2:c9602b42-d108-4dba-aacb-328ffb36303d';

const dragArea = document.querySelector(".drag-area");
const btnExplore = document.querySelector('.drag-area__explore');
const inputFile = document.querySelector('#file');
const contentFiles = document.querySelector(".content-files");
const wrapText = document.querySelector(".wrap-text");
let file

btnExplore.addEventListener('click', () => {
    inputFile.click();
});

inputFile.addEventListener('change', (event) => {
    event.preventDefault();
    file = inputFile.files[0];
    fileUpload(file);
});

dragArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dragArea.classList.add("active");
});

dragArea.addEventListener("dragleave", () => {
    dragArea.classList.remove("active");
});

// aws functions
AWS.config.update({
    region: bucketRegion,
    credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
    })
});

const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {Bucket: bucketName}
});

// drop files on drag area
dragArea.addEventListener("drop", (event) => {
    event.preventDefault();
    file = event.dataTransfer.files[0];
    fileUpload(file);
});

// show text 
const loadText = (filename) => {
    let html = `
        <div class="loading-text">
            <div></div>
            <div></div>
        </div>
    `;
    wrapText.innerHTML = html;

    let data = "";
    let refreshIntervalId = setInterval(() => {
        if (data == "") {
            console.log("try ajax");
            let xhttp = new XMLHttpRequest();
            xhttp.open('POST', 'src/getText.php', true);
            xhttp.onload = function (event) {
                if (xhttp.status === 200) {
                    data = this.responseText;
                    console.log("response ajax");
                    if (data == 'pending') {
                        console.log(data);
                        loadText(filename);
                    } else {
                        let strCount = data.length;
                        let lines = strCount / 34;
                        wrapText.innerHTML = `
                            <div class="textfile">${data}</div>
                            <div class='textMetrics'>
                                <p> ${strCount} Letras</p>
                                <p>${lines.toFixed(2)} Líneas estimadas</p>
                            </div>`;
                        console.log("out ajax");
                        clearInterval(refreshIntervalId);
                    }
                    console.log(this.responseText);
                } else {
                    console.log(xhttp.status);
                }
            }
            let formData = new FormData();
            formData.append('filename', filename);
            xhttp.send(formData);
        } else {
            console.log("out ajax");
            clearInterval(refreshIntervalId);
        }
    }, 3000);

/*
    setInterval(() => {
        if (data == "") {
            let xhttp = new XMLHttpRequest();
            xhttp.open('GET', 'src/getText.php', true);
            xhttp.onload = function (event) {
                if (xhttp.status === 200) {
                    data = this.responseText;
                    console.log(this.responseText);
                } else {
                    console.log(xhttp.status);
                }
            }
            xhttp.send();
        } else {
            clearInterval(refreshIntervalId);
        }
    }, 4000);
*/
}

// ajax to send data file
function fileUpload(data) {
    let fileType = file.type;
    let validExtensions = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    let filename = data.name;
    if (filename.length >= 12) {
        let splitName = filename.split('.');
        filename = splitName[0].substring(0, 12) + '... .' + splitName[1];
    }
    if (validExtensions.includes(fileType)) {
        if (data != undefined) {
            
            // let fileName = data.name;
            let fileName = new Date().getTime() + data.name;

            console.log(fileName);

            let filePath = fileName;
            let fileUrl = 'https://' + bucketRegion + '.amazonaws.com/' +  filePath;

            s3.upload({
                Key: filePath,
                Body: file,
                ACL: 'public-read'
            }, function(err, data) {
                if(err) console.log("Error");

                console.log('Successfully Uploaded!');
            }).on('httpUploadProgress', function (progress) {
                // let uploaded = parseInt((progress.loaded * 100) / progress.total);
                let fileLoaded = Math.floor((progress.loaded / progress.total) * 100);
                let fileTotal = Math.floor(progress.total / 1000);
                let fileSize;
                (fileTotal < 1024) ? fileSize = fileTotal + ' KB' : fileSize = (progress.loaded / (1024 * 1024)).toFixed(2) + ' MB';
                let progressHTML = `<li class="wrap-files__item">
                                        <img src="assets/images/icons/png.png" class="wrap-files__icon">
                                        <div class="wrap-files__content">
                                            <div class="wrap-files__details">
                                                <span class="wrap-files__filename">${filename} • Cargando</span>
                                                <span class="wrap-files__percent">${fileLoaded}%</span>
                                            </div>
                                            <div class="progress-bar">
                                                <div class="progress" style="width: ${fileLoaded}%"></div>
                                            </div>
                                        </div>
                                    </li>`;
                contentFiles.innerHTML = progressHTML;
    
                if (progress.loaded == progress.total) {
                    let uploadedHTML = `<li class="wrap-files__item">
                                            <img src="assets/images/icons/jpg.png" class="wrap-files__icon">
                                            <div class="wrap-files__content">
                                                <div class="wrap-files__details">
                                                    <span class="wrap-files__filename">${filename}</span>
                                                    <a class="wrap-files__show">&#10004;</a>
                                                </div>
                                                <div class="wrap-files__size">
                                                    <span>${fileSize}</span>
                                                </div>
                                            </div>
                                        </li>`;
                    setTimeout(() => {
                        contentFiles.innerHTML = "";
                        contentFiles.insertAdjacentHTML("afterbegin", uploadedHTML);
                        dragArea.classList.remove("active");
                        loadText(fileName);
                    }, 3000);
                }
            });
        }   
    } else {
        console.error("Formato no valido.");
        dragArea.classList.remove("active");
    }
}
