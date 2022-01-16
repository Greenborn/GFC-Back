<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "vista_detalle_perfil".
 *
 * @property int $id
 * @property int $concursos
 * @property int $fotografia
 * @property int $primer_puesto
 * @property int $mencion
 */
class VistaDetallePerfil extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'vista_detalle_perfil';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            // [['id'], 'required'],
            [['id', 'concursos', 'fotografias', 'primer_puesto', 'mencion'], 'integer'],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'concursos' => 'concursos',
            'fotografias' => 'fotografias',
            'primer_puesto' => 'primer_puesto',
            'mencion' => 'mencion',
        ];
    }

    public function getStadistics()
    {
        return $this->hasMany(VistaDetallePerfil::className(), ['id' => 'id']);
    }


}
