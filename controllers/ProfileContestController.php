<?php
namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;

// use app\modules\v1\models\User;
use app\models\Profile;
use app\models\User;
use app\models\Contest;
// use app\models\ProfileContest;


class ProfileContestController extends BaseController {

    public $modelClass = 'app\models\ProfileContest';


    
    public function checkAccess($action, $model = null, $params = [])
    {
      $paramsGet = Yii::$app->getRequest()->getBodyParams();
      // throw ForbiddenHttpException if access should be denied
      if ($action === 'create' ) {
        if ($model == null) {
          $prf_id = $paramsGet["profile_id"];
          // $prf_id = $params["profile_id"];
        } 
          if (($prf_id !==  Yii::$app->user->identity->profile_id)
          && Yii::$app->user->identity->role_id == 3)
              throw new \yii\web\ForbiddenHttpException(sprintf('No puede inscribir porque no es su usuario. Usuario que quiere inscribir: %d, su usuario: %d',  $prf_id, Yii::$app->user->identity->profile_id));
              if (($prf_id ==  Yii::$app->user->identity->profile_id)
              && Yii::$app->user->identity->role_id == 1)
              throw new \yii\web\ForbiddenHttpException(sprintf('No puede inscribirse un usuario administrador'));


       }
    }
    
    public function prepareDataProvider(){
        $user = Yii::$app->user->identity;
         $roleGet = Yii::$app->request->get('role');
        if (!isset($roleGet)) {
          $roleGet = 3;
         }
        $esAdmin = $user->role_id == 1;
        $esDelegado = $user->role_id == 2;

        $query = $this->modelClass::find();

        $query = $this->addFilterConditions($query);
  
        if (!$esAdmin) {
           
            $cond = $esDelegado ? ['in', 'profile_id', Profile::find()->select('id')->where(['fotoclub_id' => $user->profile->fotoclub_id])] :  ['in', 'profile_id',  Profile::find()->select('id')->where(['id' => $user->profile_id])];
  
            $query->andWhere([
              'or',
              [ 'in', 'contest_id',  Contest::find()->select('id')->where(['>', 'extract(epoch from age(end_date))', 0])],
              $cond
            ]);
            
            
            //$query->andWhere(['in','profile_id', User::find()->select('profile_id')->where(['role_id' => $roleGet])]);
          }
          //$query->andWhere(['in','profile_id', User::find()->select('profile_id')->where(['role_id' => $roleGet])]);
        return new ActiveDataProvider([
          'query' => $query->orderBy(['id' => SORT_ASC]),
	  'pagination' => [
             'pageSize' => 500
          ]
        ]);
    }
}
