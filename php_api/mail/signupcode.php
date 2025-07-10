<?php
use yii\helpers\Html;
use yii\helpers\Url;

/* @var $this yii\web\View */
/* @var $user common\models\User */

?>
<div class="password-reset">
    Hola <?= $username ?>,<br><br>

    Por favor ingrese el siguiente código de verificación para confirmar su registro:<br>

    <h2><?php echo $code; ?><h2>

    <div style="font-size:10px;">Este mensaje es enviado automáticamente, por favor no lo responda </div>
</div>
