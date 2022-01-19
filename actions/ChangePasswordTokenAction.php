<?php
namespace app\actions;

use Yii;
use yii\rest\UpdateAction;
use yii\helpers\Url;
use app\models\User;

class ChangePasswordTokenAction extends UpdateAction {

    public function run( $id ) {
        $params = Yii::$app->getRequest()->getBodyParams();
        $user = User::findByPasswordResetToken($token);
  
        $new_password = isset($params['new_password']) ? $params['new_password'] : null;
  
        $response = Yii::$app->getResponse();
        $response->format = \yii\web\Response::FORMAT_JSON;
  
        if ($new_password){
          if($user){
              $user->password_hash = Yii::$app->getSecurity()->generatePasswordHash($new_password);
              if($user->save()){
                  $response->data = [
                      'status' => $status,
                      'id'   => $user->id
                  ];
              }else{
                  $response->data = [
                      'status' => false,
                      'message' => 'Error no se pudo cambiar la contraseña!',
                  ];                   
              }
          } else{
              $response->data = [
                  'status' => false,
                  'message' => 'Error no se pudo cambiar la contraseña!',
              ];                   
          }
        }else{
          $response->data = [
              'status' => false,
              'message' => 'Error no se pudo cambiar la contraseña!',
          ];                   
      }
 }
}