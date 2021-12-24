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
    $out = [ 'sign_up_verif_token' => $user->sign_up_verif_token, 'success' => false ];

    $transaction_p = Profile::getDb()->beginTransaction();
    //crear perfil
    $perfil = new Profile();
    $perfil->name        = $params["profileData"]["name"];
    $perfil->last_name   = $params["profileData"]["last_name"];
    $perfil->fotoclub_id = $params["profileData"]["fotoclub_id"];
    if(!$perfil->insert()){
        $transaction_p->rollBack();
        return $out;
    } 
        
    //crear usuario
    $user = new User();
    $user->username            = $params["userData"]["username"];
    $user->role_id             = $params["userData"]["role_id"];
    $user->email               = $params["userData"]["email"];
    $user->password_hash       = Yii::$app->getSecurity()->generatePasswordHash($params["userData"]["password"]);
    $user->profile_id          = $perfil->id;
    $user->status              = 0;
    $user->sign_up_verif_token = Yii::$app->getSecurity()->generatePasswordHash(rand(10000,99999));
    $user->sign_up_verif_code  = rand(10000,99999);
    if(!$user->save(false)){
        $transaction_p->rollBack();
        return $out;
    } 

    $transaction_p->commit();
    $out['success']             = true;
    $out['sign_up_verif_token'] = $user->sign_up_verif_token;

    //Se envia el email
    \Yii::$app->mailer->compose('signupcode',['code' => $user->sign_up_verif_code, 'username' => $user->username ])
        ->setFrom(['test.greenborn@outlook.com'])
        ->setTo($user->email)
        ->setSubject('[Grupo Fotográfico Centro] Código de verificación' )
        ->send();

    return $out;
  }
}

