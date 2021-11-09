<?php 

$arrayFileTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

if (!in_array($_FILES['file']['type'], $arrayFileTypes)) {
    echo 'false';
    return;
}

if (!file_exists('uploads')) mkdir('uploads', 0777);

$filename = time().'_'.$_FILES['file']['name'];

move_uploaded_file($_FILES['file']['tmp_name'], 'uploads/'.$filename);

echo 'uploads/'.$filename;

die;

?>