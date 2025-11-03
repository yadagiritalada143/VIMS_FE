import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { VMSPaginatorComponent } from './paginator.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VMSPaginatorComponent', () => {
  let component: VMSPaginatorComponent;
  let fixture: ComponentFixture<VMSPaginatorComponent>;
  CommonTestingModule.setUpTestBed(VMSPaginatorComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VMSPaginatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
