{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "pixelStreaming.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "pixelStreaming.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "pixelStreaming.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "pixelStreaming.labels" -}}
app.kubernetes.io/name: {{ include "pixelStreaming.name" . }}
helm.sh/chart: {{ include "pixelStreaming.chart" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.name: {{ .Template.Name | base }}
app: {{ template "pixelStreaming.name" . }}
chart: {{ template "pixelStreaming.chart" . }}
release: {{ .Release.Name }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Values.tenant }}
openrainbow.io/tenant: {{ .Values.tenant }}
{{- end -}}
{{- end -}}


{{/*
Common container spec.
*/}}
{{- define "pixelStreaming.spec" -}}
 {{- with .Values.images.imagePullSecrets -}}
imagePullSecrets:
  {{- toYaml . | nindent 8 }}
 {{- end -}}
 {{- with .Values.securityContext -}}
securityContext:
  {{- toYaml . | nindent 8 }}
 {{- end -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}


{{/*
Set the final MongoDB connection URL
*/}}
{{- define "rainbow-exporter.mongodb.url" -}}
{{- $mongoDatabase :=  required "A unique .Values.mongodb.auth.database is required." .Values.mongodb.auth.database -}}
{{- $mongoUser := required "A unique .Values.mongodb.auth.username is required." .Values.mongodb.auth.username -}}
{{- $mongoPassword := required "A valid .Values.mongodb.auth.password entry required!" .Values.mongodb.auth.password -}}
{{- $mongoScheme := default "mongodb+srv" .Values.mongodb.scheme -}}
{{- $mongoPort :=  "" -}}
{{- if .Values.mongodb.enabled -}}
{{- $mongoScheme = default "mongodb" .Values.mongodb.scheme -}}
{{- end -}}
{{- if eq "mongodb" $mongoScheme -}}
{{- $mongoPort =  ":27017" -}}
{{- end -}}
{{- $mongoParams := default "" .Values.mongodb.parameters -}}
{{- if (ne "" $mongoParams)  }}
{{- $mongoParams = printf "%s%s" "?" $mongoParams }}
{{- end -}}
{{- if .Values.mongodb.enabled }}
{{- printf "%s://%s:%s@%s-%s%s/%s%s" $mongoScheme $mongoUser $mongoPassword .Release.Name "mongodb" $mongoPort $mongoDatabase $mongoParams | quote -}}
{{- else -}}
{{- $mongoHost := required "A valid .Values.mongodb.host entry required when helm mongo dependency is not enabled!" .Values.mongodb.host -}}
{{- printf "%s://%s:%s@%s%s/%s%s" $mongoScheme $mongoUser $mongoPassword $mongoHost $mongoPort $mongoDatabase $mongoParams | quote -}}
{{- end -}}
{{- end -}}
