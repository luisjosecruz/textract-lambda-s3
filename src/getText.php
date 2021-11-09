<?php 

$host="matrix-cloud.ciuvrky0utx3.us-west-2.rds.amazonaws.com";
$user="admin";
$password="Q?nod3e?539u2uja*riF";
$db="dem_matrix"; //Change

$con = new mysqli($host,$user,$password,$db);
if($con->connect_errno) {
    die("Error de conexión: " . $con->mysql_connect_errno() . ", " . $con->connect_error());
}

$con->set_charset("utf8");

$filename = $_POST['filename'] . "_Job";

$query = "SELECT CHAR_LENGTH(Text) lenght, Text FROM textract WHERE textract.filename = '$filename' LIMIT 1";

$result = $con->query($query);
$row = mysqli_fetch_array($result);
$count = mysqli_num_rows($result);

if ($count > 0) {
    $data = nl2br($row['Text']);
    echo $data;
} else {
    echo "pending";
}

?>