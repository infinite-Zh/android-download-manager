package com.infinite.test;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.os.Environment;
import android.support.v7.app.AlertDialog;
import android.util.Log;
import android.view.View;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerReceiver(mReceiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
        setContentView(R.layout.activity_main);
        findViewById(R.id.btn_show).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                showPop();
            }
        });

    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        unregisterReceiver(mReceiver);
    }

    private AlertDialog mDialog;
    private long mDownloadId;

    private void showPop() {
        if (mDialog == null) {
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("更新")
                    .setMessage("本次更新内容:\n1,abcdefghijk\n2,1234567891011121314\n3,和俄are个高峰高个儿")
                    .setPositiveButton("更新", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialogInterface, int i) {
                            startDownload();
                        }
                    })
                    .setNegativeButton("忽略", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialogInterface, int i) {
                            mDialog.dismiss();
                        }
                    });
            mDialog = builder.create();
        }
        mDialog.show();
    }

    private DownloadManager downloadManager;

    private void startDownload() {

        if (checkDownloadManagerEnable()) {
            downloadManager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            Uri uri = Uri.parse("https://ftp.gnu.org/gnu/make/make-3.75.tar.gz");
            DownloadManager.Request request = new DownloadManager.Request(uri);
            request.setTitle("用药指南");
            request.setDescription("新版本下载");
            request.setDestinationInExternalFilesDir(this, getExternalCacheDir().getAbsolutePath(), "apk");
            if (mDownloadId != 0) {
                downloadManager.remove(mDownloadId);
            }
            mDownloadId = downloadManager.enqueue(request);
        }
    }

    private boolean checkDownloadManagerEnable() {
        return Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED);
    }

    public static void startInstall(Context context, Uri uri) {
        Intent install = new Intent(Intent.ACTION_VIEW);
        install.setDataAndType(uri, "application/vnd.android.package-archive");
        install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        context.startActivity(install);
    }

    private BroadcastReceiver mReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            DownloadManager.Query query = new DownloadManager.Query();
            //通过下载的id查找
            query.setFilterById(mDownloadId);
            Cursor c = downloadManager.query(query);
            if (c.moveToFirst()) {
                int status = c.getInt(c.getColumnIndex(DownloadManager.COLUMN_STATUS));
                switch (status) {

                    //下载暂停
                    case DownloadManager.STATUS_PAUSED:
                        Log.e("status", "STATUS_PAUSED");
                        break;
                    //下载延迟
                    case DownloadManager.STATUS_PENDING:
                        Log.e("status", "STATUS_PENDING");
                        break;
                    //正在下载
                    case DownloadManager.STATUS_RUNNING:
                        Log.e("status", "STATUS_RUNNING");
                        break;
                    //下载完成
                    case DownloadManager.STATUS_SUCCESSFUL:
                        //下载完成安装APK
                        String path = c.getString(c.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI));
                        startInstall(MainActivity.this, Uri.parse(path));
                        break;
                    //下载失败
                    case DownloadManager.STATUS_FAILED:
                        Toast.makeText(MainActivity.this, "下载失败", Toast.LENGTH_SHORT).show();
                        break;
                }
            }
            c.close();
        }
    };
}
