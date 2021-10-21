<?php
namespace app\actions;

use Yii;
use yii\rest\CreateAction;
use yii\helpers\Url;
use app\models\User;

class LoginAction extends CreateAction {

    public function run() {
      $params = Yii::$app->getRequest()->getBodyParams();
      $username = isset($params['username']) ? $params['username'] : null;
      $password = isset($params['password']) ? $params['password'] : null;

      $response = Yii::$app->getResponse();
      $response->format = \yii\web\Response::FORMAT_JSON;
      $status = false;

      if ($username && $password){
        $user = $this->modelClass::find()->where( ['username' => $username] )->one();

        if (!$user) {
          $message = 'No existe el usuario';
        } elseif (!$user->status) {
          $message = 'Usuario inhabilitado';
        } elseif (!Yii::$app->getSecurity()->validatePassword($password, $user->password_hash)) {
          $message = 'Contraseña incorrecta';
        } else {
          $status = true;
        }

        // $status = $user && $user->status && Yii::$app->getSecurity()->validatePassword($password, $user->password_hash);
      }

    if ($status)
        $response->data = [
          'status' => $status,
          'token'  => $user->access_token,
          'username' => $user->username,
          'roleType' => $user->role->type,
          'roleId' => $user->role->id,
          'id'   => $user->id,
        ];
    else
      $response->data = [
          'status' => $status,
          'message' => $message,
      ];
  }
}
