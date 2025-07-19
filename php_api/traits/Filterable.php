<?php
namespace app\traits;

use Yii;
use Exception;

trait Filterable {

  function addFilterConditions($query) {
    try {
      $params = Yii::$app->request->get('filter');
      if (isset($params) && is_array($params)){
        foreach ($params as $key => $value) {
          if (!is_array($value)) {
            $query->andFilterCompare($key, $value);
          } else {
            $this->buildComplexConditions($query, $key, $value);
          }
        }
      }
    } catch (Exception $e) {
      error_log("Error en Filterable::addFilterConditions: " . $e->getMessage());
      // En caso de error, continuar sin filtros
    }

    return $query;
  }

  public function buildComplexConditions($query, $value, $expressions){
    try {
      foreach ($expressions as $key => $values) {
        switch ($key) {
          case 'between': // &filter[profile.id][between]=4,7
            $expArray = explode(',', $values);
            //se ordena para garantizar que el primer valor es menor
            sort($expArray);

            $query->andFilterCompare($value, '>='.$expArray[0]);
            $query->andFilterCompare($value, '<='.$expArray[1]);

            break;
          case 'inside': // &filter[profile.id][inside]=4,7
            $expArray = explode(',', $values);
            //se ordena para garantizar que el primer valor es menor
            sort($expArray);
            $query->andFilterCompare($value, '>'.$expArray[0]);
            $query->andFilterCompare($value, '<'.$expArray[1]);

            break;
          case 'in': // &filter[profile.id][in]=4,6
            $expArray = explode(',', $values);
            $query->where(['in', $value,$expArray]);
            break;
        }
      }
    } catch (Exception $e) {
      error_log("Error en Filterable::buildComplexConditions: " . $e->getMessage());
      // En caso de error, continuar sin condiciones complejas
    }
  }

}
