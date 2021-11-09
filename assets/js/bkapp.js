// declaration of varaibles
const bucketName = 'storage-textract';
const bucketRegion = 'us-west-2';
const IdentityPoolId = 'us-west-2:c9602b42-d108-4dba-aacb-328ffb36303d';

const dragArea = document.querySelector(".drag-area");
const btnExplore = document.querySelector('.drag-area__explore');
const inputFile = document.querySelector('#file');
const contentFiles = document.querySelector(".content-files");
let file

btnExplore.addEventListener('click', () => {
    inputFile.click();
});

inputFile.addEventListener('change', (event) => {
    event.preventDefault();
    file = inputFile.files[0];
    fileUpload(file);
    s3upload(file);
});

dragArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dragArea.classList.add("active");
});

dragArea.addEventListener("dragleave", () => {
    dragArea.classList.remove("active");
});

// drop files on drag area
dragArea.addEventListener("drop", (event) => {
    event.preventDefault();
    file = event.dataTransfer.files[0];
    // let fileReader = new FileReader()
    // fileReader.onload = () => dragArea.classList.remove("active")
    // fileReader.readAsDataURL(file)
    fileUpload(file);
    s3upload(file);
});

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
            let formData = new FormData();
            formData.append('file', data);
            let xhttp = new XMLHttpRequest();
            xhttp.open('POST', 'src/fileUpload.php', true);
            xhttp.upload.addEventListener("progress", ({loaded, total}) => {
                let fileLoaded = Math.floor((loaded / total) * 100);
                let fileTotal = Math.floor(total / 1000);
                let fileSize;
                (fileTotal < 1024) ? fileSize = fileTotal + ' KB' : fileSize = (loaded / (1024 * 1024)).toFixed(2) + ' MB';
                console.log(fileLoaded, fileTotal);
                let progressHTML = `
                                <li class="wrap-files__item">
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
                if (loaded == total) {
                    let uploadedHTML = `
                                        <li class="wrap-files__item">
                                            <img src="assets/images/icons/jpg.png" class="wrap-files__icon">
                                            <div class="wrap-files__content">
                                                <div class="wrap-files__details">
                                                    <span class="wrap-files__filename">${filename} &#10004; </span>
                                                    <a class="wrap-files__show">Visualizar</a>
                                                </div>
                                                <div class="wrap-files__size">
                                                    <span>${fileSize}</span>
                                                </div>
                                            </div>
                                        </li>`;
                    setTimeout(() => {
                        contentFiles.innerHTML = ""
                        contentFiles.insertAdjacentHTML("afterbegin", uploadedHTML);
                    }, 1000);
                }
            });
            xhttp.onload = function (event) {
                if (xhttp.status === 200) {
                    console.log(this.responseText);
                    dragArea.classList.remove("active");
                } else {
                    console.log(xhttp.status);
                }
            }
            xhttp.send(formData);
        }   
    } else {
        console.error("Formato no valido.");
        dragArea.classList.remove("active");
    }
}

// aws functions
AWS.config.update({
    region: bucketRegion,
    credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
    })
});

var s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {Bucket: bucketName}
});

function s3upload(file) {  
    if (file) 
    {
        var fileName = file.name;
        var filePath = fileName;
        var fileUrl = 'https://' + bucketRegion + '.amazonaws.com/' +  filePath;

        s3.upload({
            Key: filePath,
            Body: file,
            ACL: 'public-read'
        }, function(err, data) {
            if(err) console.log("Error");

            console.log('Successfully Uploaded!');
        }).on('httpUploadProgress', function (progress) {
            var uploaded = parseInt((progress.loaded * 100) / progress.total);
            console.log(uploaded);
            $("progress").attr('value', uploaded);
        });
    }
};