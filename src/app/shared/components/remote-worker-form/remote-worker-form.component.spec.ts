import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { RemoteWorkerFormComponent } from './remote-worker-form.component';

describe('RemoteWorkerFormComponent', () => {
  let component: RemoteWorkerFormComponent;
  let fixture: ComponentFixture<RemoteWorkerFormComponent>;
  CommonTestingModule.setUpTestBed(RemoteWorkerFormComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RemoteWorkerFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoteWorkerFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
