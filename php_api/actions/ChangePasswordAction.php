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

      // Verificar que el usuario existe
      if (!$user) {
        $response = Yii::$app->getResponse();
        $response->format = \yii\web\Response::FORMAT_JSON;
        $response->statusCode = 404;
        $response->data = [
          'status' => false,
          'message' => 'Usuario no encontrado'
        ];
        return;
      }

      $old_password = isset($params['old_password']) ? $params['old_password'] : null;
      $new_password = isset($params['new_password']) ? $params['new_password'] : null;

      $response = Yii::$app->getResponse();
      $response->format = \yii\web\Response::FORMAT_JSON;

      // Verificar que se proporcionaron ambos passwords
      if (!$new_password || !$old_password) {
        $response->statusCode = 400;
        $response->data = [
          'status' => false,
          'message' => 'Faltan datos: old_password y new_password son requeridos'
        ];
        return;
      }

      $transaction = User::getDb()->beginTransaction();
      try {
        $status = Yii::$app->getSecurity()->validatePassword($old_password, $user->password_hash);
        if ($status) {
          $user->password_hash = Yii::$app->getSecurity()->generatePasswordHash($new_password);
          if ($user->save()) {
            $transaction->commit();
            $response->data = [
              'status' => true,
              'id'   => $user->id,
              'message' => 'Contraseña actualizada exitosamente'
            ];
          } else {
            $transaction->rollBack();
            $response->statusCode = 500;
            $response->data = [
              'status' => false,
              'message' => 'Error interno al guardar la nueva contraseña'
            ];
          }
        } else {
          $transaction->rollBack();
          $response->statusCode = 400;
          $response->data = [
            'status' => false,
            'message' => 'Contraseña actual incorrecta'
          ];
        }
      } catch (Exception $e) {
        $transaction->rollBack();
        $response->statusCode = 500;
        $response->data = [
          'status' => false,
          'message' => 'Error interno del servidor'
        ];
      }
    }
}