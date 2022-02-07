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
        $user          = Yii::$app->user->identity;
        $esAdmin       = $user->role_id == 1;
        $esDelegado    = $user->role_id == 2;
        $esConcursante = $user->role_id == 3;
        $esJuez        = $user->role_id == 4;

        $query = $this->modelClass::find();

        if (!$esAdmin) {
            $query = $query->joinWith('image');
        }

        $query = $this->addFilterConditions($query);

        return new ActiveDataProvider([
          'query' => $query->orderBy(['id' => SORT_ASC]),
          'pagination' => [
                'pageSize' => 500
           ]
        ]);
    }
}