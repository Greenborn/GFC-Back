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
        //Se envia el email
        $url = 'http://localhost:34555';
        $headers = [
          'Content-Type: application/json'
        ];
        $data = [
          'html' => '<div class="password-reset">
          <p>Hola '.$user->username.',</p>
      
          <p>Sigue el link para recuperar tu contraseña:</p>
      
          <a href="https://www.grupofotograficocentro.com/reset-password-token?token='.$user->password_reset_token."'>Resetear contraseña</a>
      </div>",
          'text' => 'Hola '.$user->username.' Por favor copie y pegue el siguiente enlace en su navegador para recperar su contraseña: https://www.grupofotograficocentro.com/reset-password-token?token='.$user->password_reset_token,
          'to' => $user->email,
          'subject' => '[Grupo Fotográfico Centro] Recuperacion de contraseña'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        $resp_curl = curl_exec($ch);
        $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if($status_code == 500) {
          throw new Exception('Error en la solicitud cURL: ' . curl_error($ch));
        }
        curl_close($ch);
        
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