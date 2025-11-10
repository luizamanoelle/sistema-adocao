# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.

# usei python manage.py inspectdb pra criar

from django.db import models

class Animais(models.Model):
    animal_id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255, blank=True, null=True)
    sexo = models.CharField(max_length=1, blank=True, null=True)
    idade = models.IntegerField(blank=True, null=True)
    foto = models.BinaryField(blank=True, null=True)
    tipo = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Animais'

class Entrevista(models.Model):
    entrevista_id = models.AutoField(primary_key=True)
    data_field = models.DateField(db_column='data_')  # Field renamed because it ended with '_'.
    observacoes = models.CharField(max_length=255, blank=True, null=True)
    processo_etapa = models.ForeignKey('ProcessoEtapa', models.DO_NOTHING, db_column='processo_etapa')

    class Meta:
        managed = False
        db_table = 'entrevista'

class EtapaRelacao(models.Model):
    etapa_relacao_id = models.AutoField(primary_key=True)
    template = models.ForeignKey('Template', models.DO_NOTHING, db_column='template')
    etapa = models.ForeignKey('Etapas', models.DO_NOTHING, db_column='etapa')
    responsavel = models.ForeignKey('TipoUsuario', models.DO_NOTHING, db_column='responsavel')
    proximo = models.ForeignKey('self', models.DO_NOTHING, db_column='proximo', blank=True, null=True)
    alternativo = models.ForeignKey('self', models.DO_NOTHING, db_column='alternativo', related_name='etaparelacao_alternativo_set', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Etapa_Relacao'

class Etapas(models.Model):
    etapa_id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Etapas'

class Processo(models.Model):
    processo_id = models.AutoField(primary_key=True)
    template = models.ForeignKey('Template', models.DO_NOTHING, db_column='template')
    usuario = models.ForeignKey('Usuarios', models.DO_NOTHING, db_column='usuario')
    status_field = models.CharField(db_column='status_', max_length=255)  # Field renamed because it ended with '_'.

    class Meta:
        managed = False
        db_table = 'Processo'

class ProcessoEtapa(models.Model):
    processo_etapa_id = models.AutoField(primary_key=True)
    processo = models.ForeignKey(Processo, models.DO_NOTHING, db_column='processo')
    etapa_relacao = models.ForeignKey(EtapaRelacao, models.DO_NOTHING, db_column='etapa_relacao')
    status_field = models.CharField(db_column='status_', max_length=255)  # Field renamed because it ended with '_'.
    # O 'usuario' aqui pode ser nulo (null=True), pois a atribuição é feita pela procedure
    usuario = models.ForeignKey('Usuarios', models.DO_NOTHING, db_column='usuario', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Processo_Etapa'

class Recusa(models.Model):
    recusa_id = models.AutoField(primary_key=True)
    justificativa = models.CharField(max_length=255, blank=True, null=True)
    processo_etapa = models.ForeignKey(ProcessoEtapa, models.DO_NOTHING, db_column='processo_etapa')

    class Meta:
        managed = False
        db_table = 'recusa'

class Solicitacao(models.Model):
    solicitacao_id = models.AutoField(primary_key=True)
    processo_etapa = models.ForeignKey(ProcessoEtapa, models.DO_NOTHING, db_column='processo_etapa')
    cpf = models.CharField(max_length=255)
    animal = models.ForeignKey(Animais, models.DO_NOTHING, db_column='animal')
    comprovante_residencia = models.BinaryField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'solicitacao'

class Template(models.Model):
    template_id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Template'

class TipoUsuario(models.Model):
    tipo_id = models.AutoField(primary_key=True)
    categoria = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Tipo_Usuario'

class Usuarios(models.Model):
    usuario_id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255, blank=True, null=True)
    idade = models.IntegerField(blank=True, null=True)
    email = models.CharField(max_length=255, blank=True, null=True)
    senha = models.CharField(max_length=255, blank=True, null=True)
    tipo_usuario = models.ForeignKey(TipoUsuario, models.DO_NOTHING, db_column='tipo_usuario', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Usuarios'

class Validacao(models.Model):
    validacao_id = models.AutoField(primary_key=True)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    etapa_relacao = models.ForeignKey(EtapaRelacao, models.DO_NOTHING, db_column='etapa_relacao')

    class Meta:
        managed = False
        db_table = 'validacao'

class Visitacao(models.Model):
    visitacao_id = models.AutoField(primary_key=True)
    data_field = models.DateField(db_column='data_')  # Field renamed because it ended with '_'.
    endereco = models.CharField(max_length=255)
    processo_etapa = models.ForeignKey(ProcessoEtapa, models.DO_NOTHING, db_column='processo_etapa')

    class Meta:
        managed = False
        db_table = 'visitacao'