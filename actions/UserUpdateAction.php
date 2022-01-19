<?php
namespace app\actions;

use Yii;
use yii\rest\UpdateAction;
use yii\helpers\Url;
use app\models\User;
use app\models\Profile;
use app\models\Role;

class UserUpdateAction extends UpdateAction {

    public function run($id) {
        $params = Yii::$app->getRequest()->getBodyParams();
    
        $username = $params['username'] ?? null;
        $password = $params['password'] ?? null;
        $role_id = $params['role_id'] ?? null;
        $profile_id = $params['profile_id'] ?? null;
    
        $response = Yii::$app->getResponse();
        $response->format = \yii\web\Response::FORMAT_JSON;
        $status = false;
    
        if (!empty($username) && !empty($role_id) && !empty($profile_id)) {
          $profile = Profile::find()->where( ['id' => $profile_id] )->one();
          $role = Role::find()->where( ['id' => $role_id] )->one();
          if ($profile && $role) {
            $transaction = User::getDb()->beginTransaction();
            $user = $this->modelClass::find()->where( ['id' => $id] )->one();
            if (!empty($username))
              $user->username = $username;
            if (!empty($password)) 
              $user->password_hash = Yii::$app->getSecurity()->generatePasswordHash($password);
            if (!empty($role_id))
              $user->role_id = $role_id;
            if (!empty($profile_id))
              $user->profile_id = $profile_id;
            // $user->access_token = "ewrg(//(/FGtygvTCFR%&45fg6h7tm6tg65dr%RT&H/(O_O";
            // $user->access_token = "12345;$user->role_id;$user->profile_id";
            $user->updated_at = (string) time();
            if ($user->save()) {
              $transaction->commit();
              $status = true;
            } else {
                $transaction->rollBack();
            }
          }
        }
    
        $response->data = $status ? [
          'status' => $user->status,
          'token'  => $user->access_token,
          'username' => $user->username,
          // 'roleType' => $user->role->type,
          'role_id' => $user->role->id,
          'profile_id' => $user->profile->id,
          'id'   => $user->id,
        ] : [
          'status' => $status,
          'message' => 'Error en la creación del usuario',
        ];
    }
}
