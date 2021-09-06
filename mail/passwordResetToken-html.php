<?php
use yii\helpers\Html;
use yii\helpers\Url;

/* @var $this yii\web\View */
/* @var $user common\models\User */

?>
<div class="password-reset">
    <p>Hola <?= Html::encode($user->username) ?>,</p>

    <p>Sigue el link para recuperar tu contraseña:</p>

    <a href="http://localhost:8100/reset-password-token?token=<?php echo $user->password_reset_token; ?>">Resetear contraseña</a>
</div>