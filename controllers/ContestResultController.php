<?php
namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;

use app\models\Profile;
use app\models\Contest;

class ContestResultController extends BaseController {

    public $modelClass = 'app\models\ContestResult';

    public function prepareDataProvider(){
        $user = Yii::$app->user->identity;
        $esAdmin = $user->role_id == 1;
        $esDelegado = $user->role_id == 2;

        $query = $this->modelClass::find();

        if (!$esAdmin) {
            $query = $query->joinWith('image');
        }

        $query = $this->addFilterConditions($query);

        if (!$esAdmin) {
          $cond = $esDelegado ? ['in', 'image.profile_id', Profile::find()->select('id')->where(['fotoclub_id' => $user->profile->fotoclub_id])] :
            ['image.profile_id' => $user->profile_id];
          $query->andWhere([
            'or',
            [ 'in', 'contest_id',  Contest::find()->select('id')->where(['>', 'extract(epoch from age(end_date))', 0])],
            $cond
          ]);
        }
  
        
        // $query->andWhere($condition);
        // $user = User::findIdentityByAccessToken($this->getAccessToken());
        // if ($esDelegado) { // delegado
        //   $query = $query->andWhere( ['in', 'image.profile_id', Profile::find()->select('id')->where(['fotoclub_id' => $user->profile->fotoclub_id])] );
        // }
  
        return new ActiveDataProvider([
          'query' => $query->orderBy(['id' => SORT_ASC]),
        ]);
    }
}