<?php
namespace app\actions;

use Yii;
use yii\rest\CreateAction;
use yii\helpers\Url;
use app\models\User;
use app\models\Profile;
use app\models\Role;
use yii\web\BadRequestHttpException;

class SignUpAction extends CreateAction {

  public function run() {
    $params = Yii::$app->getRequest()->getBodyParams();
    
    $response = Yii::$app->getResponse();
    $response->format = \yii\web\Response::FORMAT_JSON;
    $out = [ 'sign_up_verif_token' => '', 'success' => false, 'error' => '', 'profile' => [] ];
    $transaction_created = False;

    //se verifica que el usuario no exista
    $user = User::find()->where(['username' => $params["userData"]["username"]])->orWhere(['email' => $params["userData"]["email"]])->one();
    if ( $user !== NULL && $user->status == 1 ){
      if ($user->email == $params["userData"]["email"]){
        $out['error'] = 'Ya existe un usuario con registrado con el email ingresado';
        $out['field'] = 'email';
      } else {
        $out['error'] = 'El usuario ya existe, pruebe con un nombre de usuario diferente';
        $out['field'] = 'username';
      }
      return $out;
    }

    //Si no existe ningun usuario no debe existir ningun perfil
    if ($user == NULL){
      $transaction_p       = Profile::getDb()->beginTransaction();
      $transaction_created = True;
      $perfil              = new Profile();
      $user                = new User();
    } else {
      $perfil = Profile::find()->where(['id' => $user->profile_id])->one();
    }

    //se completa la información de perfil
    $perfil->name        = $params["profileData"]["name"];
    $perfil->last_name   = $params["profileData"]["last_name"];
    if (isset($params["profileData"]["fotoclub_id"])){
      $perfil->fotoclub_id = $params["profileData"]["fotoclub_id"];
    }
    if ($transaction_created){
      if(!$perfil->insert()){
        $transaction_p->rollBack();
        return $out;
      }
    } else {
      if(!$perfil->save(false)){
        $transaction_p->rollBack();
        return $out;
      }
    }
    
    //se completa la información del usuario
    $user->username            = $params["userData"]["username"];
    $user->role_id             = $params["userData"]["role_id"];
    $user->email               = $params["userData"]["email"];
    $user->dni                 = $params["profileData"]["dni"];
    $user->password_hash       = Yii::$app->getSecurity()->generatePasswordHash($params["userData"]["password"]);
    $user->profile_id          = $perfil->id;
    $user->status              = 0;
    $user->sign_up_verif_token = Yii::$app->getSecurity()->generatePasswordHash(rand(10000,99999));
    $user->sign_up_verif_code  = rand(10000,99999);
    if(!$user->save(false)){
      if ($transaction_created){
        $transaction_p->rollBack();
      }
      return $out;
    } 

    if ($transaction_created){
      $transaction_p->commit();
    }
    
    $out['success']             = true;
    $out['sign_up_verif_token'] = $user->sign_up_verif_token;
    $out['profile']             = [ 'id' => $perfil->id ];

    //Se envia el email
    $url = 'http://localhost:34555/email';
    $headers = [
      'Content-Type: application/json'
    ];
    $data = [
      'html' => '<div class="password-reset">
              Hola '.$user->username.',<br><br>
          
              Por favor ingrese el siguiente código de verificación para confirmar su registro:<br>
          
              <h2>'.$user->sign_up_verif_code.'<h2>
          
              <div style="font-size:10px;">Este mensaje es enviado automáticamente, por favor no lo responda </div>
          </div>',
      'text' => 'Hola '.$user->username.' Por favor ingrese el siguiente código de verificación para confirmar su registro: '.$user->sign_up_verif_code,
      'to' => $user->email,
      'from' => 'registro.gfc@greenborn.com.ar',
      'subject' => '[Grupo Fotográfico Centro] Código de verificación'
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
    return $out;
  }

}

