<?php
namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;

// use app\modules\v1\models\User;
use app\models\Profile;
use app\models\User;
use app\models\Contest;


class ProfileContestController extends BaseController {

    public $modelClass = 'app\models\ProfileContest';

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
  
        // if ($esDelegado) { // delegado
        //   $query = $query->andWhere( ['in', 'profile_id', Profile::find()->select('id')->where(['fotoclub_id' => $user->profile->fotoclub_id])]);
        // }
        
          if (!$esAdmin) {
           
              $cond = $esDelegado ? ['in', 'profile_id', Profile::find()->select('id')->where(['fotoclub_id' => $user->profile->fotoclub_id])] : ['profile_id' => $user->profile_id];
  
            // if (($roleGet == 4) && $esDelegado){
            //   $cond = ['in', 'profile_id', Profile::find()->select('id')->where(['role_id' => $roleGet])];
            // }
            $query->andWhere([
              'or',
              [ 'in', 'contest_id',  Contest::find()->select('id')->where(['>', 'extract(epoch from age(end_date))', 0])],
              $cond
            ]);
            // if ($roleGet == 3){
            //   $query->andWhere(['not in', 'role_id',  Profile::find()->select('id')->where(['role_id' => 4])]);
            // } else if ($roleGet == 4) {
            //   $query->andWhere(['role_id' => $roleGet]);

            // }
            $query->andWhere(['in','profile_id', User::find()->select('profile_id')->where(['role_id' => $roleGet])]);
          }
          $query->andWhere(['in','profile_id', User::find()->select('profile_id')->where(['role_id' => $roleGet])]);
        return new ActiveDataProvider([
          'query' => $query->orderBy(['id' => SORT_ASC]),
        ]);
    }
}