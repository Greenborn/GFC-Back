<?php
namespace app\controllers;

use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;

class FotoclubController extends BaseController {

    protected $autenticator = false;
    //TODO: solo no necesita autentificacion para get, para lo demas si, modificar¿? en footer tambien
    public $modelClass = 'app\models\Fotoclub';

    public function prepareDataProvider(){
        $query = $this->modelClass::find();
  
        $query = $this->addFilterConditions($query);
  
        return new ActiveDataProvider([
          'query' => $query->orderBy(['name' => SORT_ASC]),
          'pagination' => [
                'pageSize' => 500
          ]
        ]);
    }

}