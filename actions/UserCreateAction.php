<?php
namespace app\actions;

use Yii;
use yii\rest\CreateAction;
use yii\helpers\Url;
use app\models\User;
use app\models\Profile;
use app\models\Role;
use yii\web\BadRequestHttpException;

class UserCreateAction extends CreateAction {

  public function run() {
    $params = Yii::$app->getRequest()->getBodyParams();
    
    $username = $params['username'] ?? null;
    $password = $params['password'] ?? null;
    $role_id = $params['role_id'] ?? null;
    $profile_id = $params['profile_id'] ?? null;

    $response = Yii::$app->getResponse();
    $response->format = \yii\web\Response::FORMAT_JSON;
    $status = false;

    if (!empty($username) && !empty($password) && !empty($role_id) && !empty($profile_id)) {
      $profile = Profile::find()->where( ['id' => $profile_id] )->one();
      $role = Role::find()->where( ['id' => $role_id] )->one();
      if ($profile && $role) {
        
        $transaction = User::getDb()->beginTransaction();
        $user = new User;
        $user->username = $username;
        $user->role_id = $role_id;
        $user->profile_id = $profile_id;
        $user->status = $role_id > 2 ? 0 : 1; // admin y delegado activos
        $user->access_token = "12345;$role_id;$profile_id";
        $user->password_hash = Yii::$app->getSecurity()->generatePasswordHash($password);
        $user->created_at = (string) time();
        if ($user->insert()) {
          $transaction->commit();
          $status = true;
        } else {
          $transaction->rollBack();
        }
      }
    }

    if ($status) {
      $response->data = [
        'status' => $user->status,
        'token'  => $user->access_token,
        'username' => $user->username,
        // 'roleType' => $user->role->type,
        'role_id' => $user->role->id,
        'profile_id' => $user->profile->id,
        'id'   => $user->id,
      ];
    } else {
      throw new BadRequestHttpException;
      // $response->statusCode = 400;
    }

    // $response->data = $status ? [
    //   'status' => $user->status,
    //   'token'  => $user->access_token,
    //   'username' => $user->username,
    //   // 'roleType' => $user->role->type,
    //   'role_id' => $user->role->id,
    //   'profile_id' => $user->profile->id,
    //   'id'   => $user->id,
    // ] : [
    //   'status' => $status,
    //   'message' => 'Error en la creación del usuario',
    // ];
  }
}

