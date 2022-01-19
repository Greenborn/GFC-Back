<?php
namespace app\actions;

use Yii;
use yii\rest\UpdateAction;
use yii\helpers\Url;
use app\models\User;
use yii\web\BadRequestHttpException;

class ChangePasswordAction extends UpdateAction {

    public function run($id) {
      $params = Yii::$app->getRequest()->getBodyParams();
      $user = User::find()->where(['id' => $id])->one();

      $old_password = isset($params['old_password']) ? $params['old_password'] : null;
      $new_password = isset($params['new_password']) ? $params['new_password'] : null;

      $response = Yii::$app->getResponse();
      $response->format = \yii\web\Response::FORMAT_JSON;

      if ($new_password && $old_password){
        $transaction = User::getDb()->beginTransaction();
        $status = Yii::$app->getSecurity()->validatePassword($old_password, $user->password_hash);
        if($status){
            $user->password_hash = Yii::$app->getSecurity()->generatePasswordHash($new_password);
            if($user->save()){
                $transaction->commit();
                $response->data = [
                    'status' => $status,
                    'id'   => $user->id
                ];
            }else{
                $transaction->rollBack();
                throw new BadRequestHttpException('Hubo un problema con la nueva contraseña');
                // $response->data = [
                //     'status' => false,
                //     'message' => 'Error no se pudo cambiar la contraseña!',
                // ];                   
            }
        }else{
            // $transaction->rollBack();
          throw new BadRequestHttpException('Contraseña equivocada');
            // $response->data = [
            //     'status' => false,
            //     'message' => 'Error no se pudo cambiar la contraseña!',
            // ];                   
        }
      } else{
        // $transaction->rollBack();
        throw new BadRequestHttpException('Faltan datos');
        // $response->data = [
        //     'status' => false,
        //     'message' => 'Error no se pudo cambiar la contraseña!',
        // ];                   
    }
 }
}