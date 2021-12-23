<?php
use yii\helpers\Html;
use yii\helpers\Url;

/* @var $this yii\web\View */
/* @var $user common\models\User */

?>
<div class="password-reset">
    <p>Hola <?= $username ?>,</p>

    <p>Por favor ingrese el siguiente código de verificación para confirmar su registro:</p>

    <h2><?php echo $code; ?><h2>
</div>