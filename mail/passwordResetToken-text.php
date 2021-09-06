
<?php

/* @var $this yii\web\View */
/* @var $user common\models\User */

?>
Hola <?= $user->username ?>,

Sigue el link para recuperar tu contraseña:

<a href="http://localhost:8100/reset-password-token?token=<?php echo $user->password_reset_token; ?>">Resetear contraseña</a>