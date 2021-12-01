<?php
namespace app\actions;

use Yii;
use yii\rest\CreateAction;
use app\models\User;
use app\models\Profile;


class PasswordResetAction extends CreateAction{

    public function run() {
        $params = Yii::$app->getRequest()->getBodyParams();
        $email = isset($params['email']) ? $params['email'] : null;
  
        $response = Yii::$app->getResponse();
        $response->format = \yii\web\Response::FORMAT_JSON;
        $status = false;
        $user;
        
        if ($email){
          $profile = Profile::find()->where( ['email' => $email] )->one();
          $user = User::find()->where( ['profile_id' => $profile->id] )->one();
          // $status = $user;
        }

        if (!$user) {
          $response->data = [
            'status' => $status,
            'message' => 'Acceso no autorizado!',
          ];
        }

        if (!User::isPasswordResetTokenValid($user->password_reset_token)) {
            $user->generatePasswordResetToken();
            if (!$user->save()) {
              $response->data = [
                'status' => $status,
                'message' => 'Acceso no autorizado!',
              ];
            } else {
              $status = true;
            }
              
        }

  
      if ($status){
        $message = Yii::$app
              ->mailer
              ->compose(
                  ['html' => 'passwordResetToken-html', 'text' => 'passwordResetToken-text'],
                  ['user' => $user]
                )
              ->setFrom([Yii::$app->params['supportEmail'] => Yii::$app->name . ' robot'])
              ->setTo($email)
              ->setSubject('Recuperacion de contraseña para ' . Yii::$app->name)
              ->send();
          $response->data = [
            'status' => $status,
            'message' => 'Email enviado!',
           ];
        }
      else
        $response->data = [
            'status' => $status,
            'message' => 'Acceso no autorizado!',
        ];
    }
   
}