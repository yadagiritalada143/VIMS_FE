import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PaginatorComponent } from './paginator.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('PaginatorComponent', () => {
  let component: PaginatorComponent;
  let fixture: ComponentFixture<PaginatorComponent>;
  CommonTestingModule.setUpTestBed(PaginatorComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(PaginatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
